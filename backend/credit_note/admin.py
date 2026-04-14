from django.contrib import admin

from .models import CreditNote


@admin.register(CreditNote)
class CreditNoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'invoice', 'amount', 'credit_date')
