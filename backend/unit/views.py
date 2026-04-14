from django.db.models import Exists, OuterRef
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

from lease.models import Lease

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
        'building__name',
        'building__city',
        'building__address_line1',
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

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.annotate(
            has_active_lease=Exists(
                Lease.objects.filter(unit_id=OuterRef('pk'), status='active'),
            ),
        )

    def _base_queryset_for_org(self, org_id: int):
        return Unit.objects.filter(building__org_id=org_id).select_related('building')
