from rest_framework import serializers

from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'org', 'name', 'billing_type', 'is_active', 'created_at', 'updated_at']
