from rest_framework import serializers

from .models import Landlord


class LandlordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Landlord
        fields = [
            'id',
            'org',
            'name',
            'legal_name',
            'email',
            'phone',
            'address_line1',
            'address_line2',
            'city',
            'region',
            'postal_code',
            'country_code',
            'contact_info',
            'bank_details',
            'created_at',
            'updated_at',
        ]
