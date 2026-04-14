from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

from .filters import VendorFilter
from .models import Vendor
from .serializers import VendorSerializer


class VendorViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = VendorFilter
    search_fields = [
        'name',
        'vendor_type',
        'email',
        'phone',
        'address_line1',
        'address_line2',
        'city',
        'region',
        'postal_code',
        'tax_id',
        'payment_terms',
        'internal_notes',
    ]
    ordering_fields = [
        'id',
        'name',
        'vendor_type',
        'email',
        'city',
        'region',
        'is_active',
        'created_at',
        'updated_at',
    ]
    ordering = ['id']
    user_filter_kind = 'vendor'

    def _base_queryset_for_org(self, org_id: int):
        return Vendor.objects.filter(org_id=org_id)
