"""Keep invoice status in sync with payment allocations."""

from __future__ import annotations

from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import PaymentAllocation


@receiver(pre_save, sender=PaymentAllocation)
def payment_allocation_presave(sender, instance: PaymentAllocation, **kwargs) -> None:
    if instance.pk:
        try:
            old = PaymentAllocation.objects.get(pk=instance.pk)
            instance._pa_prev_invoice_id = old.invoice_id
        except PaymentAllocation.DoesNotExist:
            instance._pa_prev_invoice_id = None
    else:
        instance._pa_prev_invoice_id = None


@receiver(post_save, sender=PaymentAllocation)
def payment_allocation_post_save(sender, instance: PaymentAllocation, **kwargs) -> None:
    from invoice.services.sync_status import sync_invoice_status_from_allocations

    ids: set[int] = {instance.invoice_id}
    prev = getattr(instance, '_pa_prev_invoice_id', None)
    if prev and prev != instance.invoice_id:
        ids.add(prev)
    for iid in ids:
        sync_invoice_status_from_allocations(iid)


@receiver(post_delete, sender=PaymentAllocation)
def payment_allocation_post_delete(sender, instance: PaymentAllocation, **kwargs) -> None:
    from invoice.services.sync_status import sync_invoice_status_from_allocations

    sync_invoice_status_from_allocations(instance.invoice_id)
