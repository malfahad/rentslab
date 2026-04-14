from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

from .filters import LeaseFilter
from .models import Lease
from .serializers import LeaseSerializer


class LeaseViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Lease.objects.all().order_by('id')
    serializer_class = LeaseSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = LeaseFilter
    search_fields = [
        'status',
        'external_reference',
        'unit__unit_number',
        'unit__building__name',
    ]
    ordering_fields = [
        'id',
        'start_date',
        'end_date',
        'rent_amount',
        'status',
        'created_at',
        'updated_at',
    ]
    ordering = ['id']
    user_filter_kind = 'lease'

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related('unit', 'unit__building', 'tenant', 'managed_by')

    def _base_queryset_for_org(self, org_id: int):
        return Lease.objects.filter(unit__building__org_id=org_id).order_by('id')
