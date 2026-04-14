from django.db import models


class Payment(models.Model):
    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='payments')
    tenant = models.ForeignKey('tenant.Tenant', on_delete=models.CASCADE, related_name='payments')
    lease = models.ForeignKey(
        'lease.Lease',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='payments',
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    method = models.CharField(max_length=32, default='bank')
    reference = models.CharField(max_length=255, blank=True)
    payment_date = models.DateTimeField()
    payer_name = models.CharField(max_length=255, blank=True)
    payer_type = models.CharField(max_length=32, blank=True)
    payer_email = models.EmailField(max_length=320, blank=True)
    payer_phone = models.CharField(max_length=64, blank=True)
    payer_address_line1 = models.CharField(max_length=255, blank=True)
    payer_address_line2 = models.CharField(max_length=255, blank=True)
    payer_city = models.CharField(max_length=128, blank=True)
    payer_region = models.CharField(max_length=128, blank=True)
    payer_postal_code = models.CharField(max_length=32, blank=True)
    payer_country_code = models.CharField(max_length=2, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment'
        indexes = [
            models.Index(fields=['org', 'payment_date'], name='payment_org_date_idx'),
            models.Index(fields=['tenant', 'payment_date'], name='payment_tenant_date_idx'),
        ]
