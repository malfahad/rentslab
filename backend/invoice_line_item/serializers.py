from rest_framework import serializers

from .models import InvoiceLineItem


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLineItem
        fields = ['id', 'invoice', 'line_number', 'description', 'amount', 'service', 'created_at']
