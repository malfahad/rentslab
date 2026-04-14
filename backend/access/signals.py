"""Default roles per org and upward VIEW propagation for ShareGrant."""

from django.db.models.signals import post_save
from django.dispatch import receiver

from access.constants import PERM_MANAGE, PERM_VIEW, SCOPE_BUILDING, SCOPE_UNIT
from access.models import ShareGrant
from access.services import provision_default_roles_for_org
from org.models import Org


@receiver(post_save, sender=Org)
def ensure_default_roles_on_org_create(sender, instance: Org, created: bool, **kwargs) -> None:
    if created:
        provision_default_roles_for_org(instance)


def _ensure_view_grant(org_id: int, scope: str, object_id: int | None, grantee_id: int) -> None:
    ShareGrant.objects.get_or_create(
        org_id=org_id,
        scope=scope,
        object_id=object_id,
        grantee_id=grantee_id,
        permission_level=PERM_VIEW,
        defaults={'granted_by_id': None},
    )


@receiver(post_save, sender=ShareGrant)
def propagate_share_view_upward(sender, instance: ShareGrant, **kwargs) -> None:
    """
    VIEW (and MANAGE, which implies VIEW) on a child resource ensures VIEW on ancestors
    so users can navigate the tree.
    """
    if getattr(instance, '_skip_propagation', False):
        return
    if instance.permission_level not in (PERM_VIEW, PERM_MANAGE):
        return

    org_id = instance.org_id
    gid = instance.grantee_id

    if instance.scope == SCOPE_UNIT and instance.object_id:
        from unit.models import Unit

        try:
            unit = Unit.objects.select_related('building').get(pk=instance.object_id)
        except Unit.DoesNotExist:
            return
        # Parent building VIEW only; do not add ORG ALL (would widen list APIs incorrectly).
        _ensure_view_grant(org_id, SCOPE_BUILDING, unit.building_id, gid)
