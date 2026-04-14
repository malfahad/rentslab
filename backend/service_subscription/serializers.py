from rest_framework import serializers

from .models import ServiceSubscription


class ServiceSubscriptionSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    currency = serializers.CharField(required=False, allow_blank=True, max_length=3, default='')

    class Meta:
        model = ServiceSubscription
        fields = [
            'id',
            'lease',
            'service',
            'service_name',
            'rate',
            'currency',
            'billing_cycle',
            'effective_from',
            'effective_to',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        cur = validated_data.get('currency')
        if cur is None or cur == '':
            service = validated_data.get('service')
            if service is not None:
                validated_data['currency'] = getattr(service, 'currency', '') or ''
        return super().create(validated_data)
