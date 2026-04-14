from decimal import Decimal

from rest_framework import serializers

from access.services import get_org_id_from_request

from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    expense_number = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=64,
        default='',
    )
    currency_code = serializers.CharField(required=False, allow_blank=True, max_length=3)
    payment_method = serializers.CharField(required=False, allow_blank=True, max_length=32)
    reference = serializers.CharField(required=False, allow_blank=True, max_length=255)
    receipt_url = serializers.CharField(required=False, allow_blank=True, max_length=1024)

    class Meta:
        model = Expense
        fields = [
            'id',
            'org',
            'expense_category',
            'expense_number',
            'expense_date',
            'amount',
            'currency_code',
            'description',
            'status',
            'building',
            'unit',
            'lease',
            'vendor',
            'job_order',
            'payment_method',
            'reference',
            'receipt_url',
            'approved_by',
            'paid_at',
            'created_at',
            'updated_at',
        ]

    def validate_org(self, org):
        request = self.context.get('request')
        oid = get_org_id_from_request(request) if request else None
        if oid is not None and org.pk != oid:
            raise serializers.ValidationError('Organization does not match request context.')
        return org

    def validate_amount(self, value: Decimal):
        if value == 0:
            raise serializers.ValidationError('Amount must not be zero.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        org_id = get_org_id_from_request(request) if request else None

        org = attrs.get('org')
        if org is None and self.instance is not None:
            org = self.instance.org

        category = attrs.get('expense_category')
        if category is None and self.instance is not None:
            category = self.instance.expense_category
        if category and org and category.org_id != org.pk:
            raise serializers.ValidationError({'expense_category': 'Category must belong to the expense organization.'})
        if category and org_id is not None and category.org_id != org_id:
            raise serializers.ValidationError({'expense_category': 'Category is not in the current organization.'})

        building = attrs.get('building')
        if building is None and self.instance is not None:
            building = self.instance.building

        unit = attrs.get('unit')
        if unit is None and self.instance is not None:
            unit = self.instance.unit

        lease = attrs.get('lease')
        if lease is None and self.instance is not None:
            lease = self.instance.lease

        vendor = attrs.get('vendor')
        if vendor is None and self.instance is not None:
            vendor = self.instance.vendor

        job_order = attrs.get('job_order')
        if job_order is None and self.instance is not None:
            job_order = self.instance.job_order

        if building and org_id is not None and building.org_id != org_id:
            raise serializers.ValidationError({'building': 'Building is not in the current organization.'})
        if building and org and building.org_id != org.pk:
            raise serializers.ValidationError({'building': 'Building must belong to the expense organization.'})

        if unit:
            if org_id is not None and unit.building.org_id != org_id:
                raise serializers.ValidationError({'unit': 'Unit is not in the current organization.'})
            if org and unit.building.org_id != org.pk:
                raise serializers.ValidationError({'unit': 'Unit must belong to the expense organization.'})
            if building and unit.building_id != building.pk:
                raise serializers.ValidationError({'unit': 'Unit must belong to the selected building.'})

        if lease:
            if org_id is not None and lease.tenant.org_id != org_id:
                raise serializers.ValidationError({'lease': 'Lease is not in the current organization.'})
            if org and lease.tenant.org_id != org.pk:
                raise serializers.ValidationError({'lease': 'Lease must belong to the expense organization.'})

        if vendor:
            if org_id is not None and vendor.org_id != org_id:
                raise serializers.ValidationError({'vendor': 'Vendor is not in the current organization.'})
            if org and vendor.org_id != org.pk:
                raise serializers.ValidationError({'vendor': 'Vendor must belong to the expense organization.'})

        if job_order:
            if org_id is not None and job_order.org_id != org_id:
                raise serializers.ValidationError({'job_order': 'Job order is not in the current organization.'})
            if org and job_order.org_id != org.pk:
                raise serializers.ValidationError({'job_order': 'Job order must belong to the expense organization.'})
            if building and job_order.building_id != building.pk:
                raise serializers.ValidationError({'job_order': 'Job order building must match expense building when both are set.'})

        return attrs
