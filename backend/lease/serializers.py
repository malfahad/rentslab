from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from unit.models import Unit

from .models import Lease


class LeaseSerializer(serializers.ModelSerializer):
    rent_currency = serializers.CharField(required=False, allow_blank=True, max_length=3, default='')
    deposit_currency = serializers.CharField(required=False, allow_blank=True, max_length=3, default='')
    building_name = serializers.CharField(source='unit.building.name', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    managed_by_name = serializers.SerializerMethodField()
    unit_label = serializers.SerializerMethodField()

    class Meta:
        model = Lease
        fields = [
            'id',
            'unit',
            'tenant',
            'managed_by',
            'building_name',
            'tenant_name',
            'managed_by_name',
            'unit_label',
            'start_date',
            'end_date',
            'rent_amount',
            'rent_currency',
            'deposit_amount',
            'deposit_currency',
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

    def get_managed_by_name(self, obj):
        u = obj.managed_by
        if not u:
            return None
        name = (getattr(u, 'name', None) or '').strip()
        if name:
            return name
        email = (getattr(u, 'email', None) or '').strip()
        if email:
            return email
        phone = (getattr(u, 'phone', None) or '').strip()
        if phone:
            return phone
        username = (getattr(u, 'username', None) or '').strip()
        if username:
            return username
        return None

    def get_unit_label(self, obj):
        u = obj.unit
        if u is None:
            return ''
        bname = ''
        if u.building_id and getattr(u, 'building', None):
            bname = u.building.name or ''
        unum = u.unit_number or ''
        if bname and unum:
            return f'{bname} — {unum}'
        return bname or unum or f'Unit #{u.pk}'

    def validate(self, attrs):
        attrs = super().validate(attrs)
        raw_unit = attrs.get('unit')
        status = attrs.get('status')
        if raw_unit is None and self.instance is not None:
            unit_id = self.instance.unit_id
        elif raw_unit is not None:
            unit_id = raw_unit.pk if hasattr(raw_unit, 'pk') else raw_unit
        else:
            unit_id = None
        if self.instance is not None and status is None:
            status = self.instance.status
        elif status is None and self.instance is None:
            status = 'active'
        if unit_id is not None and status == 'active':
            u = Unit.objects.filter(pk=unit_id).only('status').first()
            if u is not None and u.status == 'maintenance':
                raise ValidationError(
                    {
                        'unit': (
                            'This unit is under maintenance and cannot take an active lease.'
                        ),
                    },
                )
            qs = Lease.objects.filter(unit_id=unit_id, status='active')
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise ValidationError(
                    {'unit': 'This unit already has an active lease.'},
                )
        return attrs
