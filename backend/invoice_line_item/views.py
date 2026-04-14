from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import InvoiceLineItem
from .serializers import InvoiceLineItemSerializer


class InvoiceLineItemViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = InvoiceLineItem.objects.all().order_by('invoice', 'line_number')
    serializer_class = InvoiceLineItemSerializer
    user_filter_kind = 'invoice_line_item'

    def _base_queryset_for_org(self, org_id: int):
        return InvoiceLineItem.objects.filter(invoice__org_id=org_id).order_by('invoice', 'line_number')
