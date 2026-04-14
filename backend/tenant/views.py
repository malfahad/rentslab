from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import Tenant
from .serializers import TenantSerializer


class TenantViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Tenant.objects.all().order_by('id')
    serializer_class = TenantSerializer
    user_filter_kind = 'tenant'

    def _base_queryset_for_org(self, org_id: int):
        return Tenant.objects.filter(org_id=org_id).order_by('id')
