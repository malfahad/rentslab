"""Signals for the expense app."""

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Expense


@receiver(post_save, sender=Expense)
def expense_post_save_refresh_job_order_cost(sender, instance, **kwargs):
    if instance.job_order_id:
        from job_order.services import refresh_job_order_actual_cost

        refresh_job_order_actual_cost(instance.job_order_id)


@receiver(post_delete, sender=Expense)
def expense_post_delete_refresh_job_order_cost(sender, instance, **kwargs):
    if instance.job_order_id:
        from job_order.services import refresh_job_order_actual_cost

        refresh_job_order_actual_cost(instance.job_order_id)
