from rest_framework import serializers

from access.models import RoleDefinition

from .models import UserRole


class UserRoleSerializer(serializers.ModelSerializer):
    role_key = serializers.CharField(source='role_definition.key', read_only=True)

    class Meta:
        model = UserRole
        fields = [
            'id',
            'user',
            'org',
            'role_definition',
            'role',
            'role_key',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'org', 'role', 'role_key', 'created_at', 'updated_at']

    def validate_role_definition(self, rd: RoleDefinition) -> RoleDefinition:
        org_id = self.context.get('org_id')
        if org_id is not None and rd.org_id != org_id:
            raise serializers.ValidationError('Role must belong to the organization from X-Org-ID.')
        return rd
