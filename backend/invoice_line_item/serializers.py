from rest_framework import serializers

from .models import InvoiceLineItem


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True, allow_null=True)

    class Meta:
        model = InvoiceLineItem
        fields = [
            'id',
            'invoice',
            'line_number',
            'description',
            'amount',
            'service',
            'service_name',
            'billing_period_start',
            'billing_period_end',
            'line_kind',
            'job_order',
            'created_at',
        ]
