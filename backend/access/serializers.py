from rest_framework import serializers

from access.constants import ALL_PERMS, ALL_SCOPES
from access.models import RoleDefinition, ShareGrant


class RoleDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoleDefinition
        fields = ['id', 'org', 'key', 'name', 'is_system', 'created_at', 'updated_at']
        read_only_fields = ['id', 'org', 'is_system', 'created_at', 'updated_at']

    def validate(self, attrs):
        if self.instance and self.instance.is_system:
            if attrs.get('key') and attrs['key'] != self.instance.key:
                raise serializers.ValidationError({'key': 'System role key cannot be changed.'})
        return attrs


class ShareGrantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShareGrant
        fields = [
            'id',
            'org',
            'scope',
            'object_id',
            'grantee',
            'permission_level',
            'granted_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'org', 'granted_by', 'created_at', 'updated_at']

    def validate_scope(self, value: str) -> str:
        if value not in ALL_SCOPES:
            raise serializers.ValidationError(f'Allowed scopes: {", ".join(ALL_SCOPES)}')
        return value

    def validate_permission_level(self, value: str) -> str:
        if value not in ALL_PERMS:
            raise serializers.ValidationError(f'Allowed levels: {", ".join(ALL_PERMS)}')
        return value
