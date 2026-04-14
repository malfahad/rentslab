from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from access.pagination import StandardPagination
from access.services import get_org_id_from_request
from access.view_mixins import OrgScopedViewSetMixin

from .filters import PaymentFilter
from .models import Payment
from .serializers import PaymentCreateSerializer, PaymentSerializer


class PaymentViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-payment_date', 'id')
    serializer_class = PaymentSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = PaymentFilter
    search_fields = [
        'reference',
        'payer_name',
        'payer_email',
        'tenant__name',
    ]
    ordering_fields = ['id', 'amount', 'payment_date', 'method', 'created_at']
    ordering = ['-payment_date', 'id']
    user_filter_kind = 'payment'

    def get_serializer_class(self):
        if getattr(self, 'action', None) == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['org_id'] = get_org_id_from_request(self.request)
        return ctx

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related('tenant', 'lease', 'org')

    def _base_queryset_for_org(self, org_id: int):
        return Payment.objects.filter(org_id=org_id).order_by('-payment_date', 'id')
