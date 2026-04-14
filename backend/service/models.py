from django.db import models


class Service(models.Model):
    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=128)
    billing_type = models.CharField(max_length=32, default='fixed')
    currency = models.CharField(
        max_length=3,
        blank=True,
        help_text='ISO 4217 code for default billing amounts (e.g. USD, KES).',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'service'
        indexes = [
            models.Index(fields=['org'], name='service_org_idx'),
        ]
