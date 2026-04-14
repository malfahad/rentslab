from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from access.services import get_org_id_from_request
from access.view_mixins import OrgScopedViewSetMixin
from invoice_line_item.serializers import InvoiceLineItemSerializer

from .models import JobOrder
from .serializers import JobOrderRechargeSerializer, JobOrderSerializer
from .services import add_job_recharge_line


class JobOrderViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = JobOrder.objects.all().order_by('-created_at', 'id')
    serializer_class = JobOrderSerializer
    user_filter_kind = 'job_order'

    def _base_queryset_for_org(self, org_id: int):
        return JobOrder.objects.filter(org_id=org_id).order_by('-created_at', 'id')

    @action(detail=True, methods=['post'], url_path='recharge')
    def recharge(self, request, pk=None):
        """Add a tenant recharge line item to an invoice for this job order."""
        job = self.get_object()
        ser = JobOrderRechargeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        org_id = get_org_id_from_request(request)
        inv = ser.validated_data['invoice']
        if org_id is None or inv.org_id != org_id or job.org_id != org_id:
            return Response(
                {'detail': 'Invoice and job order must belong to the current organization.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            line = add_job_recharge_line(
                job,
                inv,
                ser.validated_data['amount'],
                ser.validated_data['description'],
            )
        except DjangoValidationError as e:
            err = getattr(e, 'message_dict', None) or {'detail': e.messages}
            return Response(err, status=status.HTTP_400_BAD_REQUEST)
        return Response(InvoiceLineItemSerializer(line).data, status=status.HTTP_201_CREATED)
