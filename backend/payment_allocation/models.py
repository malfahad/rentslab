from django.db import models


class PaymentAllocation(models.Model):
    payment = models.ForeignKey('payment.Payment', on_delete=models.CASCADE, related_name='allocations')
    invoice = models.ForeignKey('invoice.Invoice', on_delete=models.CASCADE, related_name='payment_allocations')
    amount_applied = models.DecimalField(max_digits=14, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payment_allocation'
        indexes = [
            models.Index(fields=['payment'], name='payalloc_payment_idx'),
            models.Index(fields=['invoice'], name='payalloc_invoice_idx'),
        ]
