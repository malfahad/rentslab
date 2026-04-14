from rest_framework import serializers

from access.models import RoleDefinition

from .models import UserRole


class UserRoleSerializer(serializers.ModelSerializer):
    role_key = serializers.CharField(source='role_definition.key', read_only=True)
    user_label = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = [
            'id',
            'user',
            'user_label',
            'org',
            'role_definition',
            'role',
            'role_key',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'org', 'role', 'role_key', 'user_label', 'created_at', 'updated_at']

    def get_user_label(self, obj):
        u = obj.user
        name = (u.name or '').strip()
        if name:
            return name
        full = (u.get_full_name() or '').strip()
        if full:
            return full
        if u.email:
            return u.email
        if u.username:
            return u.username
        return str(u.pk)

    def validate_role_definition(self, rd: RoleDefinition) -> RoleDefinition:
        org_id = self.context.get('org_id')
        if org_id is not None and rd.org_id != org_id:
            raise serializers.ValidationError('Role must belong to the organization from X-Org-ID.')
        return rd
