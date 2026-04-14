from django.contrib import admin

from .models import Lease


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = ('id', 'unit', 'tenant', 'status', 'start_date')
