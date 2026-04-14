from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import PaymentAllocation
from .serializers import PaymentAllocationSerializer


class PaymentAllocationViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = PaymentAllocation.objects.all().order_by('id')
    serializer_class = PaymentAllocationSerializer
    user_filter_kind = 'payment_allocation'

    def _base_queryset_for_org(self, org_id: int):
        return PaymentAllocation.objects.filter(payment__org_id=org_id).order_by('id')
