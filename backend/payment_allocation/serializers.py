from rest_framework import serializers

from .models import PaymentAllocation


class PaymentAllocationSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    invoice_total_amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        source='invoice.total_amount',
        read_only=True,
    )
    invoice_status = serializers.CharField(source='invoice.status', read_only=True)

    class Meta:
        model = PaymentAllocation
        fields = [
            'id',
            'payment',
            'invoice',
            'invoice_number',
            'invoice_total_amount',
            'invoice_status',
            'amount_applied',
            'created_at',
        ]
