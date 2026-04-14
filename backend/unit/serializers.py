from rest_framework import serializers

from .models import Unit


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = [
            'id',
            'building',
            'unit_number',
            'floor',
            'entrance',
            'unit_type',
            'size',
            'status',
            'address_override_line1',
            'address_override_city',
            'internal_notes',
            'created_at',
            'updated_at',
        ]
