from rest_framework import serializers

from .models import Building


class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = [
            'id',
            'org',
            'landlord',
            'name',
            'address_line1',
            'address_line2',
            'city',
            'region',
            'postal_code',
            'country_code',
            'latitude',
            'longitude',
            'location_notes',
            'building_type',
            'created_at',
            'updated_at',
        ]
