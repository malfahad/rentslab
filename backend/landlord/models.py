from django.db import models


class Landlord(models.Model):
    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='landlords')
    name = models.CharField(max_length=255)
    legal_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(max_length=320, blank=True)
    phone = models.CharField(max_length=64, blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=128, blank=True)
    region = models.CharField(max_length=128, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    country_code = models.CharField(max_length=2, blank=True)
    contact_info = models.JSONField(null=True, blank=True)
    bank_details = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'landlord'
        indexes = [
            models.Index(fields=['org'], name='landlord_org_idx'),
        ]
