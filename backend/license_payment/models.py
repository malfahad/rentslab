from django.db import models


class LicensePayment(models.Model):
    MODE_MONTHLY = 'monthly'
    MODE_YEARLY = 'yearly'
    MODE_CHOICES = [
        (MODE_MONTHLY, 'Monthly'),
        (MODE_YEARLY, 'Yearly'),
    ]

    STATUS_UPCOMING = 'upcoming'
    STATUS_DUE = 'due'
    STATUS_PAID = 'paid'
    STATUS_VOID = 'void'
    STATUS_CHOICES = [
        (STATUS_UPCOMING, 'Upcoming'),
        (STATUS_DUE, 'Due'),
        (STATUS_PAID, 'Paid'),
        (STATUS_VOID, 'Void'),
    ]

    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='license_payments')
    tenant = models.ForeignKey(
        'tenant.Tenant',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='license_payments',
        help_text='Optional billing contact tenant record.',
    )
    mode = models.CharField(max_length=16, choices=MODE_CHOICES, default=MODE_MONTHLY)
    cycle_year = models.PositiveSmallIntegerField()
    cycle_month = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text='1-12 for monthly cycles; null for yearly cycles.',
    )
    period_start = models.DateField()
    period_end = models.DateField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_UPCOMING)
    units_count = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2, default='0.00')
    amount_due = models.DecimalField(max_digits=14, decimal_places=2, default='0.00')
    credit_balance = models.DecimalField(max_digits=14, decimal_places=2, default='0.00')
    notes = models.CharField(max_length=512, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'license_payment'
        indexes = [
            models.Index(fields=['org', 'status'], name='licpay_org_status_idx'),
            models.Index(fields=['org', 'mode', 'cycle_year'], name='licpay_org_mode_year_idx'),
            models.Index(fields=['period_start', 'period_end'], name='licpay_period_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['org', 'mode', 'cycle_year', 'cycle_month'],
                name='uniq_license_cycle_per_org',
            )
        ]
