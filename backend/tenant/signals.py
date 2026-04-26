"""Signals for the tenant app."""

from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from app_services.sms.tenant_notifications import send_tenant_welcome_sms

from .models import Tenant


@receiver(post_save, sender=Tenant, dispatch_uid='tenant_sms_welcome_post_save_v1')
def tenant_post_save(sender, instance: Tenant, created: bool, **kwargs) -> None:
    if created:
        send_tenant_welcome_sms(instance)
