from django.conf import settings
from django.db import models


class CreditNote(models.Model):
    invoice = models.ForeignKey('invoice.Invoice', on_delete=models.CASCADE, related_name='credit_notes')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    reason = models.CharField(max_length=512, blank=True)
    credit_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='credit_notes_created',
        help_text='Schema: created_by_user_id',
    )

    class Meta:
        db_table = 'credit_note'
        indexes = [
            models.Index(fields=['invoice'], name='creditnote_invoice_idx'),
        ]
