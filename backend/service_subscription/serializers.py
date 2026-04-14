from rest_framework import serializers

from .models import ServiceSubscription


class ServiceSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceSubscription
        fields = [
            'id',
            'lease',
            'service',
            'rate',
            'billing_cycle',
            'effective_from',
            'effective_to',
            'created_at',
            'updated_at',
        ]
