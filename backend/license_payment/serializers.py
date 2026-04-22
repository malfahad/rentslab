from rest_framework import serializers

from access.services import get_org_id_from_request

from .models import LicensePayment
from .services import compute_amount_due


class LicensePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LicensePayment
        fields = [
            'id',
            'org',
            'tenant',
            'mode',
            'cycle_year',
            'cycle_month',
            'period_start',
            'period_end',
            'status',
            'units_count',
            'unit_price',
            'amount_due',
            'credit_balance',
            'notes',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        org_id = get_org_id_from_request(request) if request else None
        org = attrs.get('org') or getattr(self.instance, 'org', None)
        if org_id is not None and org and org.pk != org_id:
            raise serializers.ValidationError({'org': 'Organization does not match request context.'})

        mode = attrs.get('mode') or getattr(self.instance, 'mode', LicensePayment.MODE_MONTHLY)
        month = attrs.get('cycle_month')
        if month is None and self.instance is not None:
            month = self.instance.cycle_month
        if mode == LicensePayment.MODE_MONTHLY and (month is None or month < 1 or month > 12):
            raise serializers.ValidationError({'cycle_month': 'Monthly mode requires cycle_month in 1..12.'})
        if mode == LicensePayment.MODE_YEARLY:
            attrs['cycle_month'] = None

        tenant = attrs.get('tenant')
        if tenant is None and self.instance is not None:
            tenant = self.instance.tenant
        if tenant and org and tenant.org_id != org.id:
            raise serializers.ValidationError({'tenant': 'Tenant must belong to the selected organization.'})

        units_count = attrs.get('units_count')
        if units_count is None and self.instance is not None:
            units_count = self.instance.units_count
        unit_price = attrs.get('unit_price')
        if unit_price is None and self.instance is not None:
            unit_price = self.instance.unit_price
        if units_count is not None and unit_price is not None:
            attrs['amount_due'] = compute_amount_due(units_count, unit_price)
        return attrs
