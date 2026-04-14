from rest_framework import serializers

from invoice.models import Invoice

from .models import CreditNote


class CreditNoteSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    invoice_lease = serializers.IntegerField(source='invoice.lease_id', read_only=True)

    class Meta:
        model = CreditNote
        fields = [
            'id',
            'invoice',
            'invoice_number',
            'invoice_lease',
            'amount',
            'reason',
            'credit_date',
            'created_at',
            'created_by',
        ]
        read_only_fields = ['id', 'invoice_number', 'invoice_lease', 'created_at', 'created_by']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        org_id = self.context.get('org_id')
        if org_id is not None:
            self.fields['invoice'].queryset = Invoice.objects.filter(org_id=org_id)

    def validate_invoice(self, invoice):
        org_id = self.context.get('org_id')
        if org_id is not None and invoice.org_id != org_id:
            raise serializers.ValidationError('Invoice does not belong to this organization.')
        return invoice
