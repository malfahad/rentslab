"""Signals for the payment app."""

from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from app_services.sms.tenant_notifications import send_payment_received_sms

from .models import Payment


@receiver(post_save, sender=Payment, dispatch_uid='payment_sms_received_post_save_v1')
def payment_post_save(sender, instance: Payment, created: bool, **kwargs) -> None:
    if created:
        send_payment_received_sms(instance)
