from django.db import models


class Org(models.Model):
    """Legal / SaaS tenant (property management company or owner group)."""

    name = models.CharField(max_length=255)
    org_type = models.CharField(
        max_length=32,
        default='property_manager',
        help_text='Maps to type in schema: property_manager, owner_group, reit, …',
    )
    legal_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(max_length=320, blank=True)
    phone = models.CharField(max_length=64, blank=True)
    website = models.CharField(max_length=512, blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=128, blank=True)
    region = models.CharField(max_length=128, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    country_code = models.CharField(max_length=2, blank=True)
    settings = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'org'
        indexes = [
            models.Index(fields=['org_type'], name='org_type_idx'),
            models.Index(fields=['country_code', 'city'], name='org_country_city_idx'),
        ]
