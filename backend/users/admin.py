from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('Extra', {'fields': ('phone', 'email_verified_at', 'deleted_at')}),
    )
    list_display = ('username', 'email', 'is_active', 'email_verified_at', 'deleted_at')
