from rest_framework import serializers

from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='lease.tenant.name', read_only=True)
    lease_label = serializers.SerializerMethodField()

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
