from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from access.permissions import IsOrgAdminOrgHeader, RequiresOrgContext
from access.services import get_org_id_from_request

from .models import UserRole
from .serializers import UserRoleSerializer


class UserRoleViewSet(viewsets.ModelViewSet):
    """
    List/retrieve for org members (X-Org-ID). Create/update/delete only for org admins
    (assigning roles including custom roles).
    """

    serializer_class = UserRoleSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated(), RequiresOrgContext()]
        return [IsAuthenticated(), IsOrgAdminOrgHeader()]

    def get_queryset(self):
        org_id = get_org_id_from_request(self.request)
        if org_id is None:
            return UserRole.objects.none()
        return UserRole.objects.filter(org_id=org_id).select_related('role_definition', 'org', 'user').order_by('id')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['org_id'] = get_org_id_from_request(self.request)
        return ctx

    def perform_create(self, serializer):
        org_id = get_org_id_from_request(self.request)
        serializer.save(org_id=org_id)
