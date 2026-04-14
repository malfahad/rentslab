from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

from .filters import BuildingFilter
from .models import Building
from .serializers import BuildingSerializer


class BuildingViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = BuildingFilter
    search_fields = [
        'name',
        'address_line1',
        'address_line2',
        'city',
        'region',
        'postal_code',
        'location_notes',
    ]
    ordering_fields = [
        'id',
        'name',
        'city',
        'region',
        'building_type',
        'created_at',
        'updated_at',
    ]
    ordering = ['id']
    user_filter_kind = 'building'

    def _base_queryset_for_org(self, org_id: int):
        return Building.objects.filter(org_id=org_id)
