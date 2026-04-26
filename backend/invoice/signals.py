"""Signals for the invoice app."""

from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from app_services.sms.tenant_notifications import send_invoice_issued_sms

from .models import Invoice


@receiver(post_save, sender=Invoice, dispatch_uid='invoice_sms_issued_post_save_v1')
def invoice_post_save(sender, instance: Invoice, created: bool, **kwargs) -> None:
    if created:
        send_invoice_issued_sms(instance)
