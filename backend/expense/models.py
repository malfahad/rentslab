from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Expense(models.Model):
    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='expenses')
    expense_category = models.ForeignKey(
        'expense_category.ExpenseCategory',
        on_delete=models.PROTECT,
        related_name='expenses',
    )
    expense_number = models.CharField(max_length=64, blank=True)
    expense_date = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency_code = models.CharField(max_length=3, blank=True)
    description = models.CharField(max_length=512)
    status = models.CharField(max_length=32, default='draft')
    building = models.ForeignKey(
        'building.Building',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='expenses',
    )
    unit = models.ForeignKey(
        'unit.Unit',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='expenses',
    )
    lease = models.ForeignKey(
        'lease.Lease',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='expenses',
    )
    vendor = models.ForeignKey(
        'vendor.Vendor',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='expenses',
    )
    job_order = models.ForeignKey(
        'job_order.JobOrder',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='expenses',
    )
    payment_method = models.CharField(max_length=32, blank=True)
    reference = models.CharField(max_length=255, blank=True)
    receipt_url = models.CharField(max_length=1024, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_expenses',
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expense'
        indexes = [
            models.Index(fields=['org', 'expense_date'], name='expense_org_date_idx'),
            models.Index(fields=['expense_category'], name='expense_category_idx'),
            models.Index(fields=['vendor'], name='expense_vendor_idx'),
            models.Index(fields=['building'], name='expense_building_idx'),
            models.Index(fields=['lease'], name='expense_lease_idx'),
            models.Index(fields=['job_order'], name='expense_job_order_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['org', 'expense_number'],
                condition=models.Q(expense_number__gt=''),
                name='uniq_expense_number_per_org',
            ),
        ]

    def clean(self):
        super().clean()
        if self.expense_category_id and self.org_id and self.expense_category.org_id != self.org_id:
            raise ValidationError({'expense_category': 'Category must belong to the same organization.'})
        if self.building_id and self.org_id and self.building.org_id != self.org_id:
            raise ValidationError({'building': 'Building must belong to the same organization.'})
        if self.unit_id:
            if self.unit.building.org_id != self.org_id:
                raise ValidationError({'unit': 'Unit must belong to the organization.'})
            if self.building_id and self.unit.building_id != self.building_id:
                raise ValidationError({'unit': 'Unit must belong to the selected building.'})
        if self.lease_id and self.org_id and self.lease.tenant.org_id != self.org_id:
            raise ValidationError({'lease': 'Lease must belong to the same organization.'})
        if self.vendor_id and self.org_id and self.vendor.org_id != self.org_id:
            raise ValidationError({'vendor': 'Vendor must belong to the same organization.'})
        if self.job_order_id and self.org_id and self.job_order.org_id != self.org_id:
            raise ValidationError({'job_order': 'Job order must belong to the same organization.'})
        if self.job_order_id and self.building_id and self.job_order.building_id != self.building_id:
            raise ValidationError({'job_order': 'Job order building must match expense building when both are set.'})
