from django.contrib import admin

from .models import Unit


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('id', 'unit_number', 'building', 'status')
