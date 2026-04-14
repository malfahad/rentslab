from rest_framework import serializers

from access.services import get_org_id_from_request

from .models import ExpenseCategory


class ExpenseCategorySerializer(serializers.ModelSerializer):
    code = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=64,
        default='',
    )
    description = serializers.CharField(required=False, allow_blank=True, max_length=512)

    class Meta:
        model = ExpenseCategory
        fields = [
            'id',
            'org',
            'name',
            'code',
            'description',
            'sort_order',
            'is_active',
            'created_at',
            'updated_at',
        ]

    def validate_org(self, org):
        request = self.context.get('request')
        oid = get_org_id_from_request(request) if request else None
        if oid is not None and org.pk != oid:
            raise serializers.ValidationError('Organization does not match request context.')
        return org
