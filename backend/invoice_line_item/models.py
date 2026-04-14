from django.db import models


class InvoiceLineItem(models.Model):
    invoice = models.ForeignKey('invoice.Invoice', on_delete=models.CASCADE, related_name='line_items')
    line_number = models.PositiveSmallIntegerField(default=1)
    description = models.CharField(max_length=512)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    service = models.ForeignKey(
        'service.Service',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='line_items',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'invoice_line_item'
        indexes = [
            models.Index(fields=['invoice'], name='invline_invoice_idx'),
        ]
