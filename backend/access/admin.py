from django.contrib import admin

from access.models import RoleDefinition, ShareGrant


@admin.register(RoleDefinition)
class RoleDefinitionAdmin(admin.ModelAdmin):
    list_display = ('id', 'org', 'key', 'name', 'is_system')


@admin.register(ShareGrant)
class ShareGrantAdmin(admin.ModelAdmin):
    list_display = ('id', 'org', 'scope', 'object_id', 'grantee', 'permission_level')
