from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

from .filters import TenantFilter
from .models import Tenant
from .serializers import TenantSerializer


class TenantViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Tenant.objects.all().order_by('id')
    serializer_class = TenantSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TenantFilter
    search_fields = ['name', 'email', 'phone', 'city', 'region']
    ordering_fields = ['id', 'name', 'email', 'city', 'created_at', 'updated_at']
    ordering = ['id']
    user_filter_kind = 'tenant'

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.annotate(leases_count=Count('leases'))

    def _base_queryset_for_org(self, org_id: int):
        return Tenant.objects.filter(org_id=org_id).order_by('id')
