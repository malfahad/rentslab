from django.db import models


class ServiceSubscription(models.Model):
    lease = models.ForeignKey('lease.Lease', on_delete=models.CASCADE, related_name='service_subscriptions')
    service = models.ForeignKey('service.Service', on_delete=models.CASCADE, related_name='subscriptions')
    rate = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(
        max_length=3,
        blank=True,
        help_text='ISO 4217 code for this rate; defaults from service if blank.',
    )
    billing_cycle = models.CharField(max_length=32, default='monthly')
    effective_from = models.DateField(null=True, blank=True)
    effective_to = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'service_subscription'
        indexes = [
            models.Index(fields=['lease'], name='svcsub_lease_idx'),
            models.Index(fields=['service'], name='svcsub_service_idx'),
        ]
