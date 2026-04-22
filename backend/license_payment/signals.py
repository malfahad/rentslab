from __future__ import annotations

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from unit.models import Unit

from .services import sync_org_license_unit_counts


@receiver(post_save, sender=Unit)
def sync_license_units_on_unit_save(sender, instance: Unit, created: bool, **kwargs):
    if not created:
        return
    org_id = instance.building.org_id
    sync_org_license_unit_counts(org_id)


@receiver(post_delete, sender=Unit)
def sync_license_units_on_unit_delete(sender, instance: Unit, **kwargs):
    org_id = instance.building.org_id
    sync_org_license_unit_counts(org_id)
