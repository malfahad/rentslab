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
from invoice_line_item.models import InvoiceLineItem
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
                'lease__unit__building__landlord',
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

        invoice_ids = [row.invoice_id for row in allocations]
        line_items = list(
            InvoiceLineItem.objects.filter(invoice_id__in=invoice_ids).select_related('invoice').order_by(
                'invoice_id', 'line_number', 'id'
            )
        )
        invoice_allocation_map = {row.invoice_id: row.amount_applied for row in allocations}
        line_items_by_invoice = {}
        for li in line_items:
            line_items_by_invoice.setdefault(li.invoice_id, []).append(li)

        weighted_rent = Decimal('0.00')
        weighted_subscription = Decimal('0.00')
        period_starts = []
        period_ends = []
        breakdown = []
        for inv_id, alloc_amt in invoice_allocation_map.items():
            inv = next((row.invoice for row in allocations if row.invoice_id == inv_id), None)
            if inv is None:
                continue
            inv_total = inv.total_amount if inv.total_amount and inv.total_amount > 0 else Decimal('0.00')
            ratio = (alloc_amt / inv_total) if inv_total > 0 else Decimal('0.00')
            invoice_rent = Decimal('0.00')
            invoice_subscription = Decimal('0.00')
            invoice_lines = []
            for li in line_items_by_invoice.get(inv_id, []):
                weighted_amt = (li.amount * ratio).quantize(Decimal('0.01'))
                if li.line_kind == InvoiceLineItem.LINE_KIND_RENT:
                    weighted_rent += weighted_amt
                    invoice_rent += weighted_amt
                    kind = 'rent'
                else:
                    weighted_subscription += weighted_amt
                    invoice_subscription += weighted_amt
                    kind = 'subscription'
                invoice_lines.append(
                    {
                        'line_item_id': li.id,
                        'line_number': li.line_number,
                        'description': li.description,
                        'line_kind': kind,
                        'billing_period_start': li.billing_period_start,
                        'billing_period_end': li.billing_period_end,
                        'base_amount_ugx': str(li.amount),
                        'allocated_amount_ugx': str(weighted_amt),
                    }
                )
                if li.billing_period_start is not None:
                    period_starts.append(li.billing_period_start)
                if li.billing_period_end is not None:
                    period_ends.append(li.billing_period_end)
            if not invoice_lines:
                fallback_kind = 'rent'
                invoice_rent = alloc_amt
                invoice_lines.append(
                    {
                        'line_item_id': None,
                        'line_number': 1,
                        'description': 'Allocated payment',
                        'line_kind': fallback_kind,
                        'billing_period_start': None,
                        'billing_period_end': None,
                        'base_amount_ugx': str(alloc_amt),
                        'allocated_amount_ugx': str(alloc_amt),
                    }
                )
            breakdown.append(
                {
                    'invoice_id': inv.id,
                    'invoice_number': inv.invoice_number or f'Invoice #{inv.id}',
                    'invoice_total_ugx': str(inv.total_amount),
                    'allocated_amount_ugx': str(alloc_amt),
                    'allocated_rent_ugx': str(invoice_rent.quantize(Decimal('0.01'))),
                    'allocated_subscription_ugx': str(invoice_subscription.quantize(Decimal('0.01'))),
                    'line_items': invoice_lines,
                }
            )

        tenant_name = payment.tenant.name if payment.tenant_id else payment.payer_name
        operator_name = payment.payer_name.strip() if payment.payer_name.strip() else tenant_name or 'RECEIVED'
        tenant_contact = payment.tenant.phone if payment.tenant_id else payment.payer_phone
        landlord_name = payment.org.name
        landlord_contact = payment.org.phone
        building_name = ''
        location = ''
        property_address = ''
        unit_number = ''
        period_start = None
        period_end = None
        if payment.lease_id and payment.lease.unit_id:
            location = payment.lease.unit.building.name
            building_name = payment.lease.unit.building.name
            landlord_name = payment.lease.unit.building.landlord.name
            landlord_contact = payment.lease.unit.building.landlord.phone
            unit_number = payment.lease.unit.unit_number
            b = payment.lease.unit.building
            address_parts = [
                b.name,
                b.address_line1,
                b.address_line2,
                ', '.join([part for part in [b.city, b.region] if part]),
                b.postal_code,
                b.country_code,
            ]
            property_address = ', '.join([part.strip() for part in address_parts if part and str(part).strip()])

        address_parts = [
            payment.org.address_line1,
            payment.org.address_line2,
            ', '.join([part for part in [payment.org.city, payment.org.region] if part]),
        ]
        address = ', '.join([part.strip() for part in address_parts if part and part.strip()])
        if not address:
            address = payment.org.name
        if not property_address:
            property_address = address

        ref_code = f'REP_{payment.id:06d}'
        notes = ''
        if isinstance(payment.org.settings, dict):
            notes = str(payment.org.settings.get('receipt_notes', '') or '').strip()
        rent_amount_decimal = weighted_rent.quantize(Decimal('0.01'))
        subscription_charge = weighted_subscription.quantize(Decimal('0.01'))
        if not line_items and payment.lease_id:
            rent_amount_decimal = subtotal
            subscription_charge = Decimal('0.00')
        if period_starts:
            period_start = min(period_starts)
        if period_ends:
            period_end = max(period_ends)
        status = 'paid_in_full' if subtotal >= payment.amount else 'partial'
        balance_due = payment.amount - subtotal
        if balance_due < 0:
            balance_due = Decimal('0.00')
        return Response(
            {
                'receipt_id': Payment.encode_public_receipt_id(payment.id),
                'payment_id': payment.id,
                'date_time': payment.payment_date,
                'issued_date_time': payment.created_at,
                'org': {
                    'location': location,
                    'name': payment.org.name,
                    'address': address,
                    'telephone': payment.org.phone,
                },
                'landlord': {
                    'name': landlord_name,
                    'contact': landlord_contact,
                },
                'building': {
                    'name': building_name,
                    'address': property_address,
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
                'tenant_contact': tenant_contact,
                'unit_number': unit_number,
                'period_start': period_start,
                'period_end': period_end,
                'rent_amount_ugx': str(rent_amount_decimal),
                'subscription_charge_ugx': str(subscription_charge),
                'status': status,
                'balance_due_ugx': str(balance_due),
                'notes': notes,
                'issued_by': payment.org.name,
                'invoice_breakdown': breakdown,
                'reference': payment.reference,
                'method': payment.method,
            }
        )
