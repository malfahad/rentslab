from __future__ import annotations

from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin
from invoice.models import Invoice
from unit.models import Unit

from .models import PaymentLink, PaymentLinkPayment
from .serializers import (
    CreatePaymentAttemptSerializer,
    PaymentCodeUnitListSerializer,
    PaymentLinkPaymentSerializer,
)


def _invoice_outstanding(invoice: Invoice) -> Decimal:
    allocated = invoice.payment_allocations.aggregate(s=Sum('amount_applied'))['s'] or Decimal('0.00')
    credited = invoice.credit_notes.aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
    result = invoice.total_amount - allocated - credited
    return result if result > 0 else Decimal('0.00')


def _payment_slug_for_unit(unit: Unit) -> str:
    if not unit.payment_code:
        unit.save()
        unit.refresh_from_db(fields=['payment_code'])
    return unit.payment_code


class PaymentCodeUnitViewSet(OrgScopedViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Unit.objects.all().order_by('id')
    serializer_class = PaymentCodeUnitListSerializer
    pagination_class = StandardPagination
    user_filter_kind = 'unit'

    def _base_queryset_for_org(self, org_id: int):
        return Unit.objects.filter(building__org_id=org_id).select_related('building')

    @action(detail=True, methods=['get'], url_path='detail')
    def link_detail(self, request, pk=None):
        unit = self.get_object()
        active_lease = unit.leases.filter(status='active').select_related('tenant').first()
        slug = _payment_slug_for_unit(unit)
        payment_link, _ = PaymentLink.objects.get_or_create(
            unit=unit,
            defaults={'slug': slug},
        )
        if payment_link.slug.startswith('UNIT-') and not PaymentLink.objects.filter(slug=slug).exclude(
            pk=payment_link.pk
        ).exists():
            payment_link.slug = slug
            payment_link.save(update_fields=['slug', 'updated_at'])
        invoices_payload = []
        if active_lease:
            invoices = Invoice.objects.filter(lease=active_lease).order_by('due_date', 'id')
            for inv in invoices:
                invoices_payload.append(
                    {
                        'id': inv.id,
                        'invoice_number': inv.invoice_number,
                        'due_date': inv.due_date,
                        'total_amount': str(inv.total_amount),
                        'outstanding_amount': str(_invoice_outstanding(inv)),
                        'status': inv.status,
                    }
                )

        payments_qs = payment_link.payment_attempts.select_related('invoice').order_by('-created_at')
        payments_payload = PaymentLinkPaymentSerializer(payments_qs, many=True).data
        return Response(
            {
                'unit': PaymentCodeUnitListSerializer(unit).data,
                'payment_link': {
                    'id': payment_link.id,
                    'slug': payment_link.slug,
                    'is_active': payment_link.is_active,
                    'expires_at': payment_link.expires_at,
                    'public_url': f'/pay/{payment_link.slug}',
                },
                'active_lease': (
                    {
                        'id': active_lease.id,
                        'tenant_name': active_lease.tenant.name,
                        'start_date': active_lease.start_date,
                        'end_date': active_lease.end_date,
                        'status': active_lease.status,
                    }
                    if active_lease
                    else None
                ),
                'invoices': invoices_payload,
                'payments': payments_payload,
            }
        )

    @action(detail=True, methods=['post'], url_path='deactivate-link')
    def deactivate_link(self, request, pk=None):
        unit = self.get_object()
        slug = _payment_slug_for_unit(unit)
        payment_link, _ = PaymentLink.objects.get_or_create(
            unit=unit,
            defaults={'slug': slug},
        )
        payment_link.is_active = False
        payment_link.save(update_fields=['is_active', 'updated_at'])
        return Response({'ok': True})

    @action(detail=True, methods=['post'], url_path='activate-link')
    def activate_link(self, request, pk=None):
        unit = self.get_object()
        slug = _payment_slug_for_unit(unit)
        payment_link, _ = PaymentLink.objects.get_or_create(
            unit=unit,
            defaults={'slug': slug},
        )
        payment_link.is_active = True
        payment_link.save(update_fields=['is_active', 'updated_at'])
        return Response({'ok': True})


class PublicPaymentLinkView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        try:
            link = PaymentLink.objects.select_related('unit', 'unit__building').get(slug=slug)
        except PaymentLink.DoesNotExist:
            return Response({'detail': 'Payment link not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not link.is_active:
            return Response({'detail': 'Payment link is inactive.'}, status=status.HTTP_410_GONE)
        if link.expires_at is not None and link.expires_at < timezone.now():
            return Response({'detail': 'Payment link has expired.'}, status=status.HTTP_410_GONE)

        lease = link.unit.leases.filter(status='active').select_related('tenant').first()
        invoices_payload = []
        if lease:
            invoices = Invoice.objects.filter(lease=lease).order_by('due_date', 'id')
            for inv in invoices:
                invoices_payload.append(
                    {
                        'id': inv.id,
                        'invoice_number': inv.invoice_number,
                        'due_date': inv.due_date,
                        'total_amount': str(inv.total_amount),
                        'outstanding_amount': str(_invoice_outstanding(inv)),
                        'status': inv.status,
                    }
                )
        return Response(
            {
                'payment_code': link.slug,
                'property_name': link.unit.building.name,
                'unit_number': link.unit.unit_number,
                'tenant_name': lease.tenant.name if lease and lease.tenant else '',
                'lease_id': lease.id if lease else None,
                'invoices': invoices_payload,
            }
        )

    def post(self, request, slug: str):
        try:
            link = PaymentLink.objects.get(slug=slug, is_active=True)
        except PaymentLink.DoesNotExist:
            return Response({'detail': 'Payment link not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CreatePaymentAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            invoice = Invoice.objects.get(pk=data['invoice_id'])
        except Invoice.DoesNotExist:
            return Response({'detail': 'Invoice not found.'}, status=status.HTTP_404_NOT_FOUND)

        payment = PaymentLinkPayment.objects.create(
            payment_link=link,
            invoice=invoice,
            amount=data['amount'],
            status=PaymentLinkPayment.STATUS_CREATED,
            payer_name=data['payer_name'],
            payer_email=data['payer_email'],
            payer_phone=data.get('payer_phone', ''),
            payment_method=data.get('payment_method', 'card'),
            provider_ref='pending-gateway-session',
        )
        return Response(
            {
                'id': payment.id,
                'status': payment.status,
                'provider_ref': payment.provider_ref,
                'message': 'Payment attempt created. Continue to gateway.',
            },
            status=status.HTTP_201_CREATED,
        )
