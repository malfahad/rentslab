from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='lease.tenant.name', read_only=True)
    lease_label = serializers.SerializerMethodField()
    outstanding_amount = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id',
            'lease',
            'org',
            'tenant_name',
            'lease_label',
            'invoice_number',
            'issue_date',
            'due_date',
            'total_amount',
            'outstanding_amount',
            'status',
            'bill_to_name',
            'bill_to_address_line1',
            'bill_to_address_line2',
            'bill_to_city',
            'bill_to_region',
            'bill_to_postal_code',
            'bill_to_country_code',
            'bill_to_tax_id',
            'issue_kind',
            'created_at',
            'updated_at',
        ]

    def get_lease_label(self, obj):
        lease = obj.lease
        if lease is None:
            return ''
        u = lease.unit
        if u is None:
            return ''
        bname = ''
        if u.building_id and getattr(u, 'building', None):
            bname = u.building.name or ''
        unum = u.unit_number or ''
        if bname and unum:
            return f'{bname} — {unum}'
        return bname or unum or f'Unit #{u.pk}'

    def get_outstanding_amount(self, obj):
        annotated = getattr(obj, 'outstanding_amount', None)
        if annotated is not None:
            return f'{annotated:.2f}'
        total = obj.total_amount or Decimal('0.00')
        allocated = obj.payment_allocations.aggregate(s=Sum('amount_applied'))['s'] or Decimal('0.00')
        credited = obj.credit_notes.aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        outstanding = total - allocated - credited
        if outstanding < 0:
            outstanding = Decimal('0.00')
        return f'{outstanding:.2f}'
