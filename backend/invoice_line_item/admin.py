from django.contrib import admin

from .models import InvoiceLineItem


@admin.register(InvoiceLineItem)
class InvoiceLineItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'invoice', 'line_number', 'amount')
