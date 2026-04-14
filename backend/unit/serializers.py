from rest_framework import serializers

from .models import Unit


class UnitSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source='building.name', read_only=True)
    has_active_lease = serializers.BooleanField(read_only=True, required=False)

    class Meta:
        model = Unit
        fields = [
            'id',
            'building',
            'building_name',
            'unit_number',
            'floor',
            'entrance',
            'unit_type',
            'size',
            'status',
            'has_active_lease',
            'address_override_line1',
            'address_override_city',
            'internal_notes',
            'created_at',
            'updated_at',
        ]
