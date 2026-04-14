from rest_framework import serializers

from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            'id',
            'lease',
            'org',
            'invoice_number',
            'issue_date',
            'due_date',
            'total_amount',
            'status',
            'bill_to_name',
            'bill_to_address_line1',
            'bill_to_address_line2',
            'bill_to_city',
            'bill_to_region',
            'bill_to_postal_code',
            'bill_to_country_code',
            'bill_to_tax_id',
            'created_at',
            'updated_at',
        ]
