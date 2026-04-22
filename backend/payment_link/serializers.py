from __future__ import annotations

from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from invoice.models import Invoice
from lease.models import Lease
from unit.models import Unit

from .models import PaymentLink, PaymentLinkPayment


class PaymentLinkPaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)

    class Meta:
        model = PaymentLinkPayment
        fields = [
            'id',
            'payment_link',
            'invoice',
            'invoice_number',
            'amount',
            'status',
            'payer_name',
            'payer_email',
            'payer_phone',
            'payment_method',
            'provider_ref',
            'created_at',
            'updated_at',
        ]


class PaymentCodeUnitListSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source='building.name', read_only=True)
    active_tenant_name = serializers.SerializerMethodField()
    outstanding_balance = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            'id',
            'unit_number',
            'building_name',
            'status',
            'payment_code',
            'payment_code_status',
            'active_tenant_name',
            'outstanding_balance',
        ]

    def _active_lease(self, obj: Unit) -> Lease | None:
        return obj.leases.filter(status='active').select_related('tenant').first()

    def get_active_tenant_name(self, obj: Unit) -> str:
        lease = self._active_lease(obj)
        return lease.tenant.name if lease and lease.tenant else ''

    def get_outstanding_balance(self, obj: Unit) -> str:
        lease = self._active_lease(obj)
        if not lease:
            return '0.00'
        total = Decimal('0.00')
        for inv in Invoice.objects.filter(lease=lease).only('total_amount'):
            allocated = inv.payment_allocations.aggregate(s=Sum('amount_applied'))['s'] or Decimal('0.00')
            credited = inv.credit_notes.aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
            left = inv.total_amount - allocated - credited
            if left > 0:
                total += left
        return f'{total:.2f}'


class CreatePaymentAttemptSerializer(serializers.Serializer):
    invoice_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    payer_name = serializers.CharField(max_length=255)
    payer_email = serializers.EmailField(max_length=320)
    payer_phone = serializers.CharField(max_length=64, allow_blank=True, required=False)
    payment_method = serializers.CharField(max_length=32, default='card')
