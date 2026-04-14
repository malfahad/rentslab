from rest_framework import serializers

from .models import Lease


class LeaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lease
        fields = [
            'id',
            'unit',
            'tenant',
            'managed_by',
            'start_date',
            'end_date',
            'rent_amount',
            'deposit_amount',
            'billing_cycle',
            'status',
            'billing_same_as_tenant_address',
            'billing_address_line1',
            'billing_address_line2',
            'billing_city',
            'billing_region',
            'billing_postal_code',
            'billing_country_code',
            'external_reference',
            'created_at',
            'updated_at',
        ]
