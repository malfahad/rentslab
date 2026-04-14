from django.db import models


class Unit(models.Model):
    building = models.ForeignKey('building.Building', on_delete=models.CASCADE, related_name='units')
    unit_number = models.CharField(max_length=64)
    floor = models.CharField(max_length=32, blank=True)
    entrance = models.CharField(max_length=64, blank=True)
    unit_type = models.CharField(
        max_length=32,
        default='apartment',
        help_text='Schema column type: apartment, shop, office, …',
    )
    size = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=32, default='vacant')
    address_override_line1 = models.CharField(max_length=255, blank=True)
    address_override_city = models.CharField(max_length=128, blank=True)
    internal_notes = models.CharField(max_length=512, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'unit'
        constraints = [
            models.UniqueConstraint(fields=['building', 'unit_number'], name='uniq_unit_number_per_building'),
        ]
        indexes = [
            models.Index(fields=['building'], name='unit_building_idx'),
        ]
