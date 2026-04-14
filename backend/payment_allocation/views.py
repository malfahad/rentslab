from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

from .filters import PaymentAllocationFilter
from .models import PaymentAllocation
from .serializers import PaymentAllocationSerializer


class PaymentAllocationViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = PaymentAllocation.objects.all().order_by('id')
    serializer_class = PaymentAllocationSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = PaymentAllocationFilter
    user_filter_kind = 'payment_allocation'

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related('invoice', 'payment')

    def _base_queryset_for_org(self, org_id: int):
        return PaymentAllocation.objects.filter(payment__org_id=org_id).order_by('id')
