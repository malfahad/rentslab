from rest_framework import serializers

from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    currency = serializers.CharField(required=False, allow_blank=True, max_length=3, default='')

    class Meta:
        model = Service
        fields = [
            'id',
            'org',
            'name',
            'billing_type',
            'currency',
            'is_active',
            'created_at',
            'updated_at',
        ]
