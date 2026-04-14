from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

from .filters import LandlordFilter
from .models import Landlord
from .serializers import LandlordSerializer


class LandlordViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Landlord.objects.all()
    serializer_class = LandlordSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = LandlordFilter
    search_fields = [
        'name',
        'legal_name',
        'email',
        'phone',
        'address_line1',
        'address_line2',
        'city',
        'region',
        'postal_code',
    ]
    ordering_fields = [
        'id',
        'name',
        'legal_name',
        'email',
        'city',
        'region',
        'created_at',
        'updated_at',
    ]
    ordering = ['id']
    user_filter_kind = 'landlord'

    def _base_queryset_for_org(self, org_id: int):
        return Landlord.objects.filter(org_id=org_id)
