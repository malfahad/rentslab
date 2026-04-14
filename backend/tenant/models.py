from django.db import models


class Tenant(models.Model):
    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='tenants')
    name = models.CharField(max_length=255)
    tenant_type = models.CharField(max_length=32, default='individual')
    email = models.EmailField(max_length=320, blank=True)
    phone = models.CharField(max_length=64, blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=128, blank=True)
    region = models.CharField(max_length=128, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    country_code = models.CharField(max_length=2, blank=True)
    company_registration_number = models.CharField(max_length=128, blank=True)
    tax_id = models.CharField(max_length=128, blank=True)
    contact_info = models.JSONField(null=True, blank=True)
    kyc_info = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant'
        indexes = [
            models.Index(fields=['org'], name='tenant_org_idx'),
            models.Index(fields=['org', 'name'], name='tenant_org_name_idx'),
        ]
