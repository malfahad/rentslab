from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets

from access.models import RoleDefinition, ShareGrant
from access.permissions import IsOrgAdminOrgHeader, IsOrgAdminOrShareManager, RequiresOrgContext
from access.serializers import RoleDefinitionSerializer, ShareGrantSerializer
from access.services import get_org_id_from_request


class RoleDefinitionViewSet(viewsets.ModelViewSet):
    """Custom roles: only org admins can create/update/delete. System roles cannot be deleted."""

    queryset = RoleDefinition.objects.all()
    serializer_class = RoleDefinitionSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated(), RequiresOrgContext()]
        return [IsAuthenticated(), IsOrgAdminOrgHeader()]

    def get_queryset(self):
        org_id = get_org_id_from_request(self.request)
        if org_id is None:
            return RoleDefinition.objects.none()
        return RoleDefinition.objects.filter(org_id=org_id).order_by('id')

    def perform_create(self, serializer):
        org_id = get_org_id_from_request(self.request)
        serializer.save(org_id=org_id)

    def perform_destroy(self, instance):
        if instance.is_system:
            raise PermissionDenied('System roles cannot be deleted.')
        super().perform_destroy(instance)


class ShareGrantViewSet(viewsets.ModelViewSet):
    """
    Share VIEW/MANAGE on a scope (ORG / BUILDING / UNIT / …) and optional object id.
    Admins or org-wide MANAGE holders may use list; writes require MANAGE on target or admin.
    """

    queryset = ShareGrant.objects.all()
    serializer_class = ShareGrantSerializer
    permission_classes = [IsAuthenticated, IsOrgAdminOrShareManager]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        org_id = get_org_id_from_request(self.request)
        if org_id is None:
            return ShareGrant.objects.none()
        return ShareGrant.objects.filter(org_id=org_id).order_by('id')

    def perform_create(self, serializer):
        org_id = get_org_id_from_request(self.request)
        serializer.save(
            org_id=org_id,
            granted_by=self.request.user if self.request.user.is_authenticated else None,
        )
