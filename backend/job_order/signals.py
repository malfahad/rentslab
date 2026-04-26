"""Signals for the job_order app."""

from __future__ import annotations

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from app_services.sms.tenant_notifications import send_job_order_update_sms

from .models import JobOrder


@receiver(pre_save, sender=JobOrder, dispatch_uid='job_order_cache_prev_status_presave_v1')
def job_order_presave(sender, instance: JobOrder, **kwargs) -> None:
    if not instance.pk:
        instance._job_prev_status = None
        return
    prev = JobOrder.objects.filter(pk=instance.pk).values_list('status', flat=True).first()
    instance._job_prev_status = prev


@receiver(post_save, sender=JobOrder, dispatch_uid='job_order_sms_update_post_save_v1')
def job_order_post_save(sender, instance: JobOrder, created: bool, **kwargs) -> None:
    prev_status = getattr(instance, '_job_prev_status', None)
    if created or prev_status != instance.status:
        send_job_order_update_sms(instance)
