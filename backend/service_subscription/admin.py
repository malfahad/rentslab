from django.contrib import admin

from .models import ServiceSubscription


@admin.register(ServiceSubscription)
class ServiceSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'lease', 'service', 'rate')
