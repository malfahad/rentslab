from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

from .filters import UnitFilter
from .models import Unit
from .serializers import UnitSerializer


class UnitViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = UnitFilter
    search_fields = [
        'unit_number',
        'floor',
        'entrance',
        'internal_notes',
        'address_override_line1',
        'address_override_city',
        'status',
        'unit_type',
    ]
    ordering_fields = [
        'id',
        'unit_number',
        'floor',
        'status',
        'unit_type',
        'size',
        'created_at',
        'updated_at',
    ]
    ordering = ['id']
    user_filter_kind = 'unit'

    def _base_queryset_for_org(self, org_id: int):
        return Unit.objects.filter(building__org_id=org_id)
