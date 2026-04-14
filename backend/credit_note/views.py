from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from access.pagination import StandardPagination
from access.services import get_org_id_from_request
from access.view_mixins import OrgScopedViewSetMixin

from .filters import CreditNoteFilter
from .models import CreditNote
from .serializers import CreditNoteSerializer


class CreditNoteViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = CreditNote.objects.all().order_by('id')
    serializer_class = CreditNoteSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CreditNoteFilter
    search_fields = ['reason', 'invoice__invoice_number']
    ordering_fields = ['id', 'credit_date', 'amount', 'created_at']
    ordering = ['-credit_date', 'id']
    user_filter_kind = 'credit_note'

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related('invoice', 'invoice__lease', 'created_by')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        org_id = get_org_id_from_request(self.request)
        if org_id is not None:
            ctx['org_id'] = org_id
        return ctx

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)

    def _base_queryset_for_org(self, org_id: int):
        return CreditNote.objects.filter(invoice__org_id=org_id).order_by('id')
