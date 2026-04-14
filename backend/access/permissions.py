"""DRF permission classes for org-scoped access."""

from __future__ import annotations

from rest_framework.permissions import BasePermission

from access.constants import SCOPE_ORG
from access.services import (
    get_org_id_from_request,
    user_can_manage_share_target,
    user_has_org_membership,
    user_is_org_admin,
    user_has_manage,
)


class RequiresOrgContext(BasePermission):
    """Authenticated user with valid X-Org-ID header and membership in that org."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        org_id = get_org_id_from_request(request)
        if org_id is None:
            return False
        return user_has_org_membership(request.user, org_id)


class IsOrgAdminOrgHeader(RequiresOrgContext):
    """Org admin for the org in X-Org-ID."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return user_is_org_admin(request.user, get_org_id_from_request(request))


class IsOrgAdminOrShareManager(BasePermission):
    """
    Share API: org admins, or users with MANAGE on ORG ALL (org-wide managers), or
    MANAGE on the specific scope/object being written.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        org_id = get_org_id_from_request(request)
        if org_id is None:
            return False
        if not user_has_org_membership(request.user, org_id):
            return False
        if user_is_org_admin(request.user, org_id):
            return True
        action = getattr(view, 'action', None)
        if action == 'list':
            return user_has_manage(request.user, org_id, SCOPE_ORG, None)
        if action == 'create':
            scope = request.data.get('scope')
            raw = request.data.get('object_id')
            try:
                oid = int(raw) if raw is not None and raw != '' else None
            except (TypeError, ValueError):
                oid = None
            return user_can_manage_share_target(request.user, org_id, scope, oid)
        if action in ('retrieve', 'destroy'):
            return True
        return False

    def has_object_permission(self, request, view, obj):
        org_id = get_org_id_from_request(request)
        if org_id is None or obj.org_id != org_id:
            return False
        if user_is_org_admin(request.user, org_id):
            return True
        return user_can_manage_share_target(request.user, org_id, obj.scope, obj.object_id)
