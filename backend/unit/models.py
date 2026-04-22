import hashlib

from django.db import models


class Unit(models.Model):
    PAYMENT_CODE_STATUS_ACTIVE = 'active'
    PAYMENT_CODE_STATUS_INACTIVE = 'inactive'
    PAYMENT_CODE_STATUS_SUSPENDED = 'suspended'
    PAYMENT_CODE_STATUS_CHOICES = [
        (PAYMENT_CODE_STATUS_ACTIVE, 'Active'),
        (PAYMENT_CODE_STATUS_INACTIVE, 'Inactive'),
        (PAYMENT_CODE_STATUS_SUSPENDED, 'Suspended'),
    ]

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
    payment_code = models.CharField(
        max_length=64,
        unique=True,
        null=True,
        blank=True,
        help_text='Stable public code for tenant-facing payment links.',
    )
    payment_code_status = models.CharField(
        max_length=16,
        choices=PAYMENT_CODE_STATUS_CHOICES,
        default=PAYMENT_CODE_STATUS_ACTIVE,
    )
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
            models.Index(fields=['payment_code_status'], name='unit_paycode_status_idx'),
        ]

    def _generate_payment_code(self, salt: int = 0) -> str:
        seed = f'{self.building_id}:{self.unit_number}:{self.pk or 0}:{salt}'
        return hashlib.sha256(seed.encode('utf-8')).hexdigest()[:8]

    def _next_available_payment_code(self) -> str:
        salt = 0
        while True:
            candidate = self._generate_payment_code(salt=salt)
            conflict = Unit.objects.filter(payment_code=candidate).exclude(pk=self.pk).exists()
            if not conflict:
                return candidate
            salt += 1

    def save(self, *args, **kwargs):
        if self.payment_code or not self.building_id:
            super().save(*args, **kwargs)
            return

        if self.pk is None:
            super().save(*args, **kwargs)

        self.payment_code = self._next_available_payment_code()
        update_fields = kwargs.get('update_fields')
        if update_fields is None:
            super().save(*args, **kwargs)
            return
        merged = set(update_fields)
        merged.add('payment_code')
        kwargs['update_fields'] = list(merged)
        super().save(*args, **kwargs)
