from django.db import models


class ExpenseCategory(models.Model):
    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='expense_categories')
    name = models.CharField(max_length=128)
    code = models.CharField(max_length=64, blank=True)
    description = models.CharField(max_length=512, blank=True)
    sort_order = models.SmallIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expense_category'
        indexes = [
            models.Index(fields=['org'], name='exp_cat_org_idx'),
            models.Index(fields=['org', 'is_active'], name='exp_cat_org_active_idx'),
        ]
        constraints = [
            models.UniqueConstraint(fields=['org', 'name'], name='uniq_expense_category_name_per_org'),
            models.UniqueConstraint(
                fields=['org', 'code'],
                condition=models.Q(code__gt=''),
                name='uniq_expense_category_code_per_org',
            ),
        ]
