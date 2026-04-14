from django.db import models


class Invoice(models.Model):
    lease = models.ForeignKey('lease.Lease', on_delete=models.CASCADE, related_name='invoices')
    org = models.ForeignKey(
        'org.Org',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='invoices',
    )
    invoice_number = models.CharField(max_length=64, blank=True)
    issue_date = models.DateField()
    due_date = models.DateField()
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=32, default='unpaid')
    bill_to_name = models.CharField(max_length=255, blank=True)
    bill_to_address_line1 = models.CharField(max_length=255, blank=True)
    bill_to_address_line2 = models.CharField(max_length=255, blank=True)
    bill_to_city = models.CharField(max_length=128, blank=True)
    bill_to_region = models.CharField(max_length=128, blank=True)
    bill_to_postal_code = models.CharField(max_length=32, blank=True)
    bill_to_country_code = models.CharField(max_length=2, blank=True)
    bill_to_tax_id = models.CharField(max_length=128, blank=True)
    issue_kind = models.CharField(
        max_length=16,
        blank=True,
        default='',
        help_text='Empty for legacy; "catch_up" for automated batch issuance.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoice'
        indexes = [
            models.Index(fields=['lease', 'status'], name='invoice_lease_status_idx'),
            models.Index(fields=['lease', 'due_date'], name='invoice_lease_due_idx'),
            models.Index(fields=['org', 'issue_date'], name='invoice_org_issue_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['org', 'invoice_number'],
                condition=models.Q(invoice_number__gt=''),
                name='uniq_invoice_number_per_org',
            ),
        ]
