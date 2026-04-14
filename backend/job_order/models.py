from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from .constants import JobOrderStatus, is_transition_allowed


class JobOrder(models.Model):
    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='job_orders')
    job_number = models.CharField(max_length=64, blank=True)
    building = models.ForeignKey('building.Building', on_delete=models.CASCADE, related_name='job_orders')
    unit = models.ForeignKey(
        'unit.Unit',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='job_orders',
    )
    vendor = models.ForeignKey(
        'vendor.Vendor',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='job_orders',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=32, default=JobOrderStatus.DRAFT)
    priority = models.CharField(max_length=32, blank=True)
    reported_at = models.DateTimeField(null=True, blank=True)
    scheduled_start = models.DateTimeField(null=True, blank=True)
    scheduled_end = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    estimated_cost = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reported_job_orders',
    )
    external_reference = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'job_order'
        indexes = [
            models.Index(fields=['org', 'status'], name='job_order_org_status_idx'),
            models.Index(fields=['building'], name='job_order_building_idx'),
            models.Index(fields=['unit'], name='job_order_unit_idx'),
            models.Index(fields=['vendor'], name='job_order_vendor_idx'),
            models.Index(fields=['scheduled_start'], name='job_order_scheduled_start_idx'),
        ]
        constraints = [
            models.UniqueConstraint(fields=['org', 'job_number'], name='uniq_job_number_per_org'),
        ]

    def save(self, *args, **kwargs):
        if self.status == JobOrderStatus.COMPLETED and self.completed_at is None:
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        if not (self.job_number or '').strip():
            raise ValidationError({'job_number': 'This field is required.'})
        if self.unit_id and self.building_id and self.unit.building_id != self.building_id:
            raise ValidationError({'unit': 'Unit must belong to the selected building.'})
        if self.vendor_id and self.org_id and self.vendor.org_id != self.org_id:
            raise ValidationError({'vendor': 'Vendor must belong to the same organization.'})
        if self.vendor_id and not self.vendor.is_active:
            raise ValidationError({'vendor': 'Vendor is inactive; assign an active vendor.'})
        if self.building_id and self.org_id and self.building.org_id != self.org_id:
            raise ValidationError({'building': 'Building must belong to the same organization as the job order.'})

        if self.pk:
            prev = (
                type(self)
                .objects.filter(pk=self.pk)
                .values_list('status', flat=True)
                .first()
            )
            if prev is not None and prev != self.status and not is_transition_allowed(prev, self.status):
                raise ValidationError(
                    {'status': f'Transition from {prev!r} to {self.status!r} is not allowed.'}
                )
