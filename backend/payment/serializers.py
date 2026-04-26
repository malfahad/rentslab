from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers

from invoice.models import Invoice
from payment_allocation.models import PaymentAllocation

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    public_receipt_id = serializers.SerializerMethodField()

    def get_public_receipt_id(self, obj: Payment) -> str:
        return Payment.encode_public_receipt_id(obj.pk)

    class Meta:
        model = Payment
        fields = [
            'id',
            'public_receipt_id',
            'org',
            'tenant',
            'tenant_name',
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


class PaymentAllocationInputSerializer(serializers.Serializer):
    invoice = serializers.PrimaryKeyRelatedField(queryset=Invoice.objects.all())
    amount_applied = serializers.DecimalField(max_digits=14, decimal_places=2)


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Create payment with optional invoice allocations in one transaction."""

    org = serializers.IntegerField(source='org_id', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    public_receipt_id = serializers.SerializerMethodField(read_only=True)
    allocations = PaymentAllocationInputSerializer(
        many=True,
        required=False,
        write_only=True,
    )

    def get_public_receipt_id(self, obj: Payment) -> str:
        return Payment.encode_public_receipt_id(obj.pk)

    class Meta:
        model = Payment
        fields = [
            'id',
            'public_receipt_id',
            'org',
            'tenant',
            'tenant_name',
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
            'allocations',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'org', 'tenant_name', 'created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        org_id = self.context.get('org_id')
        if org_id is not None:
            inv_field = self.fields['allocations'].child.fields['invoice']
            inv_field.queryset = Invoice.objects.filter(org_id=org_id)

    def validate_tenant(self, tenant):
        org_id = self.context.get('org_id')
        if org_id is not None and tenant.org_id != org_id:
            raise serializers.ValidationError('Tenant does not belong to this organization.')
        return tenant

    def validate_lease(self, lease):
        if lease is None:
            return lease
        org_id = self.context.get('org_id')
        if org_id is not None and lease.unit.building.org_id != org_id:
            raise serializers.ValidationError('Lease does not belong to this organization.')
        return lease

    def validate(self, attrs):
        tenant = attrs.get('tenant')
        lease = attrs.get('lease')
        if lease is not None and tenant is not None and lease.tenant_id != tenant.pk:
            raise serializers.ValidationError({'lease': 'Lease must belong to the selected tenant.'})

        org_id = self.context.get('org_id')
        amount = attrs['amount']
        allocations = attrs.get('allocations')
        if allocations is None:
            allocations = []

        total_alloc = sum((row['amount_applied'] for row in allocations), Decimal('0'))
        if total_alloc > amount:
            raise serializers.ValidationError(
                {'allocations': 'Total allocated amount cannot exceed the payment amount.'}
            )

        for row in allocations:
            inv: Invoice = row['invoice']
            applied = row['amount_applied']
            if org_id is not None and inv.org_id != org_id:
                raise serializers.ValidationError({'allocations': 'Invoice is not in this organization.'})
            if inv.lease.tenant_id != tenant.pk:
                raise serializers.ValidationError(
                    {'allocations': 'Each invoice must belong to the selected tenant.'}
                )
            if lease is not None and inv.lease_id != lease.pk:
                raise serializers.ValidationError(
                    {'allocations': 'Each invoice must match the selected lease when a lease is set.'}
                )
            paid = (
                PaymentAllocation.objects.filter(invoice=inv)
                .aggregate(s=Sum('amount_applied'))['s']
                or Decimal('0')
            )
            remaining = inv.total_amount - paid
            if applied > remaining:
                raise serializers.ValidationError(
                    {
                        'allocations': (
                            f'Amount for invoice #{inv.pk} exceeds remaining balance ({remaining}).'
                        )
                    }
                )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        allocations = validated_data.pop('allocations', None) or []
        org_id = self.context.get('org_id')
        if org_id is None:
            raise serializers.ValidationError({'detail': 'Organization context required.'})
        payment = Payment.objects.create(org_id=org_id, **validated_data)
        for row in allocations:
            PaymentAllocation.objects.create(
                payment=payment,
                invoice=row['invoice'],
                amount_applied=row['amount_applied'],
            )
        return payment
