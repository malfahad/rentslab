from decimal import Decimal

from django.db.models import Sum
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

    @staticmethod
    def _remaining_for_credit(invoice, *, exclude_credit_note_id=None):
        total = invoice.total_amount or Decimal('0')
        paid = invoice.payment_allocations.aggregate(s=Sum('amount_applied'))['s'] or Decimal('0')
        cred_qs = invoice.credit_notes.all()
        if exclude_credit_note_id is not None:
            cred_qs = cred_qs.exclude(pk=exclude_credit_note_id)
        credited = cred_qs.aggregate(s=Sum('amount'))['s'] or Decimal('0')
        rem = total - paid - credited
        if rem < 0:
            rem = Decimal('0')
        return rem

    def validate(self, attrs):
        invoice = attrs.get('invoice')
        amount = attrs.get('amount')
        instance = getattr(self, 'instance', None)
        if invoice is None and instance is not None:
            invoice = instance.invoice
        if amount is None and instance is not None:
            amount = instance.amount
        if invoice is None or amount is None:
            return attrs
        if not isinstance(amount, Decimal):
            amount = Decimal(str(amount))
        exclude_id = instance.pk if instance and instance.pk else None
        remaining = self._remaining_for_credit(invoice, exclude_credit_note_id=exclude_id)
        if amount > remaining:
            raise serializers.ValidationError(
                {
                    'amount': (
                        f'Credit amount cannot exceed remaining balance ({remaining:.2f}).'
                    ),
                },
            )
        return attrs
