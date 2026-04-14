from rest_framework import serializers

from .models import CreditNote


class CreditNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditNote
        fields = ['id', 'invoice', 'amount', 'reason', 'credit_date', 'created_at', 'created_by']
