from rest_framework import serializers

from .models import PaymentAllocation


class PaymentAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAllocation
        fields = ['id', 'payment', 'invoice', 'amount_applied', 'created_at']
