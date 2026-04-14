from rest_framework import serializers

from access.services import get_org_id_from_request

from .models import Vendor


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            'id',
            'org',
            'name',
            'vendor_type',
            'email',
            'phone',
            'address_line1',
            'address_line2',
            'city',
            'region',
            'postal_code',
            'country_code',
            'tax_id',
            'payment_terms',
            'bank_details',
            'contact_info',
            'is_active',
            'internal_notes',
            'created_at',
            'updated_at',
        ]

    def validate_org(self, org):
        request = self.context.get('request')
        oid = get_org_id_from_request(request) if request else None
        if oid is not None and org.pk != oid:
            raise serializers.ValidationError('Organization does not match request context.')
        return org
