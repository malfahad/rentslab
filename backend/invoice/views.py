from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import Invoice
from .serializers import InvoiceSerializer


class InvoiceViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('id')
    serializer_class = InvoiceSerializer
    user_filter_kind = 'invoice'

    def _base_queryset_for_org(self, org_id: int):
        return Invoice.objects.filter(org_id=org_id).order_by('id')
