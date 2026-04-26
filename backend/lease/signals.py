"""Keep unit availability in sync with lease status (one active lease per unit)."""

from __future__ import annotations

from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from app_services.sms.tenant_notifications import send_lease_activated_sms, send_lease_closed_sms

from .models import Lease


def sync_unit_occupancy(unit_id: int) -> None:
    """
    If the unit has an active lease, mark it occupied; otherwise vacant unless
    status is maintenance (manual hold).
    """
    from unit.models import Unit

    if unit_id is None:
        return
    has_active = Lease.objects.filter(unit_id=unit_id, status='active').exists()
    if has_active:
        Unit.objects.filter(pk=unit_id).update(status='occupied')
    else:
        Unit.objects.filter(pk=unit_id).exclude(status='maintenance').update(status='vacant')


@receiver(pre_save, sender=Lease, dispatch_uid='lease_cache_previous_presave_v1')
def lease_cache_previous(sender, instance: Lease, **kwargs) -> None:
    if instance.pk:
        try:
            old = Lease.objects.only('unit_id', 'status').get(pk=instance.pk)
            instance._lease_prev_unit_id = old.unit_id
            instance._lease_prev_status = old.status
        except Lease.DoesNotExist:
            instance._lease_prev_unit_id = None
            instance._lease_prev_status = None
    else:
        instance._lease_prev_unit_id = None
        instance._lease_prev_status = None


@receiver(post_save, sender=Lease, dispatch_uid='lease_sync_and_sms_post_save_v1')
def lease_post_save(sender, instance: Lease, **kwargs) -> None:
    unit_ids: set[int] = {instance.unit_id}
    prev = getattr(instance, '_lease_prev_unit_id', None)
    prev_status = getattr(instance, '_lease_prev_status', None)
    if prev and prev != instance.unit_id:
        unit_ids.add(prev)
    for uid in unit_ids:
        sync_unit_occupancy(uid)
    if instance.status == 'active' and prev_status != 'active':
        send_lease_activated_sms(instance)
    elif instance.status in {'closed', 'terminated'} and prev_status != instance.status:
        send_lease_closed_sms(instance)


@receiver(post_delete, sender=Lease, dispatch_uid='lease_sync_unit_post_delete_v1')
def lease_post_delete(sender, instance: Lease, **kwargs) -> None:
    sync_unit_occupancy(instance.unit_id)
