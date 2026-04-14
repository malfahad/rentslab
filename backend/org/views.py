from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from access.constants import ROLE_ADMIN
from access.models import RoleDefinition
from access.services import provision_default_roles_for_org
from user_role.models import UserRole

from .models import Org
from .serializers import OrgSerializer


class OrgViewSet(viewsets.ModelViewSet):
    queryset = Org.objects.all().order_by('id')
    serializer_class = OrgSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        qs = Org.objects.all().order_by('id')
        user = self.request.user
        if user.is_authenticated:
            return qs.filter(
                pk__in=UserRole.objects.filter(user_id=user.pk).values_list(
                    'org_id', flat=True
                )
            )
        return Org.objects.none()

    def perform_create(self, serializer):
        org = serializer.save()
        user = self.request.user
        if not user.is_authenticated:
            return
        provision_default_roles_for_org(org)
        admin = RoleDefinition.objects.get(org=org, key=ROLE_ADMIN)
        UserRole.objects.get_or_create(
            user=user,
            org=org,
            defaults={'role_definition': admin},
        )
