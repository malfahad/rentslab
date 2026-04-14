from rest_framework import serializers

from .models import Org


class OrgSerializer(serializers.ModelSerializer):
    class Meta:
        model = Org
        fields = [
            'id',
            'name',
            'org_type',
            'legal_name',
            'email',
            'phone',
            'website',
            'address_line1',
            'address_line2',
            'city',
            'region',
            'postal_code',
            'country_code',
            'settings',
            'created_at',
            'updated_at',
        ]
