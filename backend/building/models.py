from django.db import models


class Building(models.Model):
    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='buildings')
    landlord = models.ForeignKey('landlord.Landlord', on_delete=models.CASCADE, related_name='buildings')
    name = models.CharField(max_length=255)
    address_line1 = models.CharField(max_length=255, default='')
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=128, default='')
    region = models.CharField(max_length=128, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    country_code = models.CharField(max_length=2, default='')
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    location_notes = models.CharField(max_length=512, blank=True)
    building_type = models.CharField(
        max_length=32,
        default='residential',
        help_text='Schema column type: residential, commercial, mixed, …',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'building'
        indexes = [
            models.Index(fields=['org'], name='building_org_idx'),
            models.Index(fields=['landlord'], name='building_landlord_idx'),
            models.Index(fields=['country_code', 'city'], name='building_country_city_idx'),
            models.Index(fields=['city'], name='building_city_idx'),
        ]
