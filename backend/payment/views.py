from decimal import Decimal

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from access.pagination import StandardPagination
from access.services import get_org_id_from_request
from access.view_mixins import OrgScopedViewSetMixin
from payment_allocation.models import PaymentAllocation

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


class PublicReceiptView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, hashed_payment_id: str):
        payment_id = Payment.decode_public_receipt_id(hashed_payment_id)
        if payment_id is None:
            return Response({'detail': 'Receipt not found.'}, status=404)

        payment = (
            Payment.objects.select_related(
                'org',
                'tenant',
                'lease',
                'lease__unit',
                'lease__unit__building',
            )
            .filter(pk=payment_id)
            .first()
        )
        if payment is None:
            return Response({'detail': 'Receipt not found.'}, status=404)

        allocations = list(
            PaymentAllocation.objects.filter(payment=payment)
            .select_related('invoice')
            .order_by('created_at', 'id')
        )
        subtotal = sum((row.amount_applied for row in allocations), start=Decimal('0.00'))
        if not allocations:
            subtotal = payment.amount

        rows = []
        if allocations:
            for row in allocations:
                invoice_label = row.invoice.invoice_number or f'Invoice #{row.invoice_id}'
                rows.append(
                    {
                        'item': invoice_label,
                        'timestamp': payment.payment_date,
                        'quantity': '1.00',
                        'sales_ugx': str(row.amount_applied),
                    }
                )
        else:
            fallback_item = payment.reference.strip() if payment.reference.strip() else 'Direct payment'
            rows.append(
                {
                    'item': fallback_item,
                    'timestamp': payment.payment_date,
                    'quantity': '1.00',
                    'sales_ugx': str(payment.amount),
                }
            )

        tenant_name = payment.tenant.name if payment.tenant_id else payment.payer_name
        operator_name = payment.payer_name.strip() if payment.payer_name.strip() else tenant_name or 'RECEIVED'
        location = ''
        if payment.lease_id and payment.lease.unit_id:
            location = payment.lease.unit.building.name

        address_parts = [
            payment.org.address_line1,
            payment.org.address_line2,
            ', '.join([part for part in [payment.org.city, payment.org.region] if part]),
        ]
        address = ', '.join([part.strip() for part in address_parts if part and part.strip()])
        if not address:
            address = payment.org.name

        ref_code = f'REP_{payment.id:06d}'
        return Response(
            {
                'receipt_id': Payment.encode_public_receipt_id(payment.id),
                'payment_id': payment.id,
                'date_time': payment.payment_date,
                'org': {
                    'location': location,
                    'name': payment.org.name,
                    'address': address,
                    'telephone': payment.org.phone,
                },
                'title': 'Payment Receipt',
                'subtitle': f'For The Period {payment.payment_date.strftime("%-m/%d/%Y")}',
                'page': {'current': 1, 'total': 1},
                'operator_name': operator_name.upper(),
                'rows': rows,
                'subtotal_ugx': str(subtotal),
                'grand_total_ugx': str(subtotal),
                'footer_reference': ref_code,
                'tenant_name': tenant_name,
                'reference': payment.reference,
                'method': payment.method,
            }
        )
