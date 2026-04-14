from django.core.exceptions import ValidationError
from django.db import models


class InvoiceLineItem(models.Model):
    LINE_KIND_RENT = 'rent'
    LINE_KIND_SERVICE = 'service'
    LINE_KIND_OTHER = 'other'
    LINE_KIND_JOB_RECHARGE = 'job_recharge'
    LINE_KIND_CHOICES = [
        (LINE_KIND_RENT, 'rent'),
        (LINE_KIND_SERVICE, 'service'),
        (LINE_KIND_OTHER, 'other'),
        (LINE_KIND_JOB_RECHARGE, 'job_recharge'),
    ]

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
    billing_period_start = models.DateField(null=True, blank=True)
    billing_period_end = models.DateField(null=True, blank=True)
    line_kind = models.CharField(
        max_length=16,
        blank=True,
        default='',
        help_text='rent | service | other | job_recharge; legacy rows may be blank.',
    )
    job_order = models.ForeignKey(
        'job_order.JobOrder',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='invoice_line_items',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'invoice_line_item'
        indexes = [
            models.Index(fields=['invoice'], name='invline_invoice_idx'),
            models.Index(
                fields=['billing_period_start', 'billing_period_end'],
                name='invline_period_idx',
            ),
            models.Index(fields=['job_order'], name='invline_job_order_idx'),
        ]

    def clean(self):
        super().clean()
        if self.line_kind == self.LINE_KIND_JOB_RECHARGE and not self.job_order_id:
            raise ValidationError({'job_order': 'Job recharge lines must reference a job order.'})
