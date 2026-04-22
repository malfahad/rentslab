from django.db import models


class PaymentLink(models.Model):
    unit = models.OneToOneField('unit.Unit', on_delete=models.CASCADE, related_name='payment_link')
    slug = models.SlugField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_link'
        indexes = [
            models.Index(fields=['is_active'], name='paylink_active_idx'),
            models.Index(fields=['expires_at'], name='paylink_expiry_idx'),
        ]


class PaymentLinkPayment(models.Model):
    STATUS_CREATED = 'created'
    STATUS_PROCESSING = 'processing'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_FAILED = 'failed'
    STATUS_REFUNDED = 'refunded'
    STATUS_CHOICES = [
        (STATUS_CREATED, 'Created'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_REFUNDED, 'Refunded'),
    ]

    payment_link = models.ForeignKey(
        'payment_link.PaymentLink',
        on_delete=models.CASCADE,
        related_name='payment_attempts',
    )
    invoice = models.ForeignKey('invoice.Invoice', on_delete=models.PROTECT, related_name='payment_link_payments')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_CREATED)
    payer_name = models.CharField(max_length=255, blank=True)
    payer_email = models.EmailField(max_length=320, blank=True)
    payer_phone = models.CharField(max_length=64, blank=True)
    payment_method = models.CharField(max_length=32, default='card')
    provider_ref = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_link_payment'
        indexes = [
            models.Index(fields=['payment_link', 'status'], name='plinkpay_link_status_idx'),
            models.Index(fields=['invoice'], name='plinkpay_invoice_idx'),
            models.Index(fields=['provider_ref'], name='plinkpay_provider_idx'),
        ]
