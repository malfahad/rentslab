from rest_framework import serializers

from .models import Tenant


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = [
            'id',
            'org',
            'name',
            'tenant_type',
            'email',
            'phone',
            'address_line1',
            'address_line2',
            'city',
            'region',
            'postal_code',
            'country_code',
            'company_registration_number',
            'tax_id',
            'contact_info',
            'kyc_info',
            'created_at',
            'updated_at',
        ]
