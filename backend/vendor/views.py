from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import Vendor
from .serializers import VendorSerializer


class VendorViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Vendor.objects.all().order_by('id')
    serializer_class = VendorSerializer
    user_filter_kind = 'vendor'

    def _base_queryset_for_org(self, org_id: int):
        return Vendor.objects.filter(org_id=org_id).order_by('id')
