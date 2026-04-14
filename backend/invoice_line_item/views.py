from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

from .filters import InvoiceLineItemFilter
from .models import InvoiceLineItem
from .serializers import InvoiceLineItemSerializer


class InvoiceLineItemViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = InvoiceLineItem.objects.all().order_by('invoice', 'line_number')
    serializer_class = InvoiceLineItemSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = InvoiceLineItemFilter
    ordering_fields = ['id', 'line_number', 'amount', 'created_at']
    ordering = ['invoice', 'line_number']
    user_filter_kind = 'invoice_line_item'

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related('invoice', 'service', 'job_order')

    def _base_queryset_for_org(self, org_id: int):
        return InvoiceLineItem.objects.filter(invoice__org_id=org_id).order_by('invoice', 'line_number')
