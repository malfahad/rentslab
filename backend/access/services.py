"""Permission checks (org admin, shares)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db.models import Q

from access.constants import (
    PERM_MANAGE,
    PERM_VIEW,
    ROLE_ADMIN,
    SCOPE_BUILDING,
    SCOPE_LEASE,
    SCOPE_ORG,
    SCOPE_TENANT,
    SCOPE_UNIT,
)
from access.models import RoleDefinition, ShareGrant
from user_role.models import UserRole

if TYPE_CHECKING:
    from django.contrib.auth import get_user_model

    User = get_user_model()


def get_org_id_from_request(request) -> int | None:
    h = request.headers.get('X-Org-ID') or request.headers.get('X-Org-Id')
    if h is None or h == '':
        return getattr(request, 'org_id', None)
    try:
        return int(h)
    except (TypeError, ValueError):
        return None


def user_has_org_membership(user, org_id: int) -> bool:
    return UserRole.objects.filter(user_id=user.pk, org_id=org_id).exists()


def user_is_org_admin(user, org_id: int) -> bool:
    return UserRole.objects.filter(
        user_id=user.pk,
        org_id=org_id,
        role_definition__key=ROLE_ADMIN,
    ).exists()


def _share_qs(user, org_id: int):
    return ShareGrant.objects.filter(org_id=org_id, grantee_id=user.pk)


def user_has_view(user, org_id: int, scope: str, object_id: int | None) -> bool:
    if user_is_org_admin(user, org_id):
        return True
    qs = _share_qs(user, org_id).filter(permission_level__in=(PERM_VIEW, PERM_MANAGE))
    if scope == SCOPE_ORG and object_id is None:
        return qs.filter(scope=SCOPE_ORG, object_id__isnull=True).exists()
    return qs.filter(scope=scope, object_id=object_id).exists()


def user_has_manage(user, org_id: int, scope: str, object_id: int | None) -> bool:
    if user_is_org_admin(user, org_id):
        return True
    qs = _share_qs(user, org_id).filter(permission_level=PERM_MANAGE)
    if scope == SCOPE_ORG and object_id is None:
        return qs.filter(scope=SCOPE_ORG, object_id__isnull=True).exists()
    return qs.filter(scope=scope, object_id=object_id).exists()


def user_can_manage_share_target(user, org_id: int, scope: str, object_id: int | None) -> bool:
    """Admins always; otherwise MANAGE on same scope/object or parent (ORG ALL)."""
    if user_is_org_admin(user, org_id):
        return True
    if user_has_manage(user, org_id, SCOPE_ORG, None):
        return True
    if user_has_manage(user, org_id, scope, object_id):
        return True
    return False


def _visibility_state(user, org_id: int) -> dict | None:
    """
    None = user may see all rows in the org-scoped queryset (admin or ORG-wide VIEW/MANAGE).
    Otherwise a dict of id sets derived from ShareGrants (VIEW or MANAGE).
    """
    if not getattr(user, 'is_authenticated', False):
        return {'building_ids': set(), 'unit_ids': set(), 'lease_ids': set(), 'tenant_ids': set()}
    if user_is_org_admin(user, org_id):
        return None
    qs = _share_qs(user, org_id).filter(permission_level__in=(PERM_VIEW, PERM_MANAGE))
    if qs.filter(scope=SCOPE_ORG, object_id__isnull=True).exists():
        return None

    building_ids: set[int] = set()
    unit_ids: set[int] = set()
    lease_ids: set[int] = set()
    tenant_ids: set[int] = set()

    for oid in qs.filter(scope=SCOPE_BUILDING).values_list('object_id', flat=True):
        if oid is not None:
            building_ids.add(oid)
    for oid in qs.filter(scope=SCOPE_UNIT).values_list('object_id', flat=True):
        if oid is not None:
            unit_ids.add(oid)
    for oid in qs.filter(scope=SCOPE_LEASE).values_list('object_id', flat=True):
        if oid is not None:
            lease_ids.add(oid)
    for oid in qs.filter(scope=SCOPE_TENANT).values_list('object_id', flat=True):
        if oid is not None:
            tenant_ids.add(oid)

    if unit_ids:
        from unit.models import Unit

        building_ids.update(Unit.objects.filter(pk__in=unit_ids).values_list('building_id', flat=True))
    if lease_ids:
        from lease.models import Lease

        building_ids.update(
            Lease.objects.filter(pk__in=lease_ids).values_list('unit__building_id', flat=True)
        )

    return {
        'building_ids': building_ids,
        'unit_ids': unit_ids,
        'lease_ids': lease_ids,
        'tenant_ids': tenant_ids,
    }


def _expanded_lease_ids(state: dict) -> set[int]:
    from lease.models import Lease

    ids = set(state['lease_ids'])
    if state['unit_ids']:
        ids.update(Lease.objects.filter(unit_id__in=state['unit_ids']).values_list('pk', flat=True))
    if state['building_ids']:
        ids.update(
            Lease.objects.filter(unit__building_id__in=state['building_ids']).values_list('pk', flat=True)
        )
    return ids


def user_filtered_results(user, org_id: int, queryset, *, kind: str):
    """
    Narrow an org-scoped queryset to rows the user may see via org admin, ORG-wide share,
    or explicit BUILDING / UNIT / LEASE / TENANT grants.

    ``kind`` identifies how the queryset relates to those scopes:
    ``building``, ``unit``, ``lease``, ``tenant``, ``landlord``, ``service``,
    ``invoice``, ``invoice_line_item``, ``credit_note``, ``payment``,
    ``payment_allocation``, ``service_subscription``.
    """
    state = _visibility_state(user, org_id)
    if state is None:
        return queryset

    if kind == 'building':
        bids = state['building_ids']
        if not bids:
            return queryset.none()
        return queryset.filter(pk__in=bids)

    if kind == 'unit':
        uids, bids = state['unit_ids'], state['building_ids']
        if not uids and not bids:
            return queryset.none()
        return queryset.filter(Q(pk__in=uids) | Q(building_id__in=bids))

    if kind == 'lease':
        el = _expanded_lease_ids(state)
        if not el:
            return queryset.none()
        return queryset.filter(pk__in=el)

    if kind == 'tenant':
        tids = state['tenant_ids']
        if not tids:
            return queryset.none()
        return queryset.filter(pk__in=tids)

    if kind in ('landlord', 'service'):
        return queryset.none()

    if kind == 'invoice':
        el = _expanded_lease_ids(state)
        if not el:
            return queryset.none()
        return queryset.filter(lease_id__in=el)

    if kind in ('invoice_line_item', 'credit_note'):
        el = _expanded_lease_ids(state)
        if not el:
            return queryset.none()
        return queryset.filter(invoice__lease_id__in=el)

    if kind == 'payment':
        el = _expanded_lease_ids(state)
        tids = state['tenant_ids']
        if not el and not tids:
            return queryset.none()
        return queryset.filter(Q(lease_id__in=el) | Q(lease__isnull=True, tenant_id__in=tids))

    if kind == 'payment_allocation':
        el = _expanded_lease_ids(state)
        tids = state['tenant_ids']
        if not el and not tids:
            return queryset.none()
        return queryset.filter(
            Q(invoice__lease_id__in=el)
            | Q(payment__lease_id__in=el)
            | Q(payment__lease__isnull=True, payment__tenant_id__in=tids)
        )

    if kind == 'service_subscription':
        el = _expanded_lease_ids(state)
        if not el:
            return queryset.none()
        return queryset.filter(lease_id__in=el)

    raise ValueError(f'Unknown user_filtered_results kind: {kind!r}')


def provision_default_roles_for_org(org) -> tuple[RoleDefinition, RoleDefinition]:
    """Create system roles for a new org. Idempotent."""
    admin, _ = RoleDefinition.objects.get_or_create(
        org=org,
        key=ROLE_ADMIN,
        defaults={'name': 'Administrator', 'is_system': True},
    )
    member, _ = RoleDefinition.objects.get_or_create(
        org=org,
        key='org_member',
        defaults={'name': 'Organization member', 'is_system': True},
    )
    if not admin.is_system:
        admin.is_system = True
        admin.save(update_fields=['is_system'])
    if not member.is_system:
        member.is_system = True
        member.save(update_fields=['is_system'])
    return admin, member
