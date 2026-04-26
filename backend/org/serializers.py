from rest_framework import serializers

from .models import Org


class OrgSerializer(serializers.ModelSerializer):
    default_currency = serializers.ChoiceField(choices=['KES', 'UGX', 'TZS', 'USD'])

    class Meta:
        model = Org
        fields = [
            'id',
            'name',
            'org_type',
            'legal_name',
            'business_registration_number',
            'tax_id',
            'email',
            'phone',
            'website',
            'logo_url',
            'tagline',
            'timezone',
            'language',
            'locale',
            'default_currency',
            'address_line1',
            'address_line2',
            'city',
            'region',
            'postal_code',
            'country_code',
            'sms_notifications_enabled',
            'settings',
            'created_at',
            'updated_at',
        ]
