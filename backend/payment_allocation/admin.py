from django.contrib import admin

from .models import PaymentAllocation


@admin.register(PaymentAllocation)
class PaymentAllocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'payment', 'invoice', 'amount_applied')
