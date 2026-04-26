"""Keep invoice status in sync with payment allocations."""

from __future__ import annotations

from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from app_services.sms.tenant_notifications import send_invoice_paid_sms

from .models import PaymentAllocation


@receiver(pre_save, sender=PaymentAllocation, dispatch_uid='payment_allocation_cache_prev_presave_v1')
def payment_allocation_presave(sender, instance: PaymentAllocation, **kwargs) -> None:
    if instance.pk:
        try:
            old = PaymentAllocation.objects.get(pk=instance.pk)
            instance._pa_prev_invoice_id = old.invoice_id
        except PaymentAllocation.DoesNotExist:
            instance._pa_prev_invoice_id = None
    else:
        instance._pa_prev_invoice_id = None


@receiver(post_save, sender=PaymentAllocation, dispatch_uid='payment_allocation_sync_and_sms_post_save_v1')
def payment_allocation_post_save(sender, instance: PaymentAllocation, **kwargs) -> None:
    from invoice.models import Invoice
    from invoice.services.sync_status import sync_invoice_status_from_allocations

    ids: set[int] = {instance.invoice_id}
    prev = getattr(instance, '_pa_prev_invoice_id', None)
    if prev and prev != instance.invoice_id:
        ids.add(prev)
    for iid in ids:
        old_status = Invoice.objects.filter(pk=iid).values_list('status', flat=True).first()
        sync_invoice_status_from_allocations(iid)
        inv = Invoice.objects.select_related('lease', 'lease__tenant', 'org').filter(pk=iid).first()
        if inv and old_status != 'paid' and inv.status == 'paid':
            send_invoice_paid_sms(inv)


@receiver(
    post_delete,
    sender=PaymentAllocation,
    dispatch_uid='payment_allocation_sync_and_sms_post_delete_v1',
)
def payment_allocation_post_delete(sender, instance: PaymentAllocation, **kwargs) -> None:
    from invoice.models import Invoice
    from invoice.services.sync_status import sync_invoice_status_from_allocations

    old_status = Invoice.objects.filter(pk=instance.invoice_id).values_list('status', flat=True).first()
    sync_invoice_status_from_allocations(instance.invoice_id)
    inv = Invoice.objects.select_related('lease', 'lease__tenant', 'org').filter(pk=instance.invoice_id).first()
    if inv and old_status != 'paid' and inv.status == 'paid':
        send_invoice_paid_sms(inv)
