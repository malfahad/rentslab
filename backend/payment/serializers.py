from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id',
            'org',
            'tenant',
            'lease',
            'amount',
            'method',
            'reference',
            'payment_date',
            'payer_name',
            'payer_type',
            'payer_email',
            'payer_phone',
            'payer_address_line1',
            'payer_address_line2',
            'payer_city',
            'payer_region',
            'payer_postal_code',
            'payer_country_code',
            'created_at',
            'updated_at',
        ]
