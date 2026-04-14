from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import Payment
from .serializers import PaymentSerializer


class PaymentViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-payment_date', 'id')
    serializer_class = PaymentSerializer
    user_filter_kind = 'payment'

    def _base_queryset_for_org(self, org_id: int):
        return Payment.objects.filter(org_id=org_id).order_by('-payment_date', 'id')
