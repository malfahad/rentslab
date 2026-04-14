"""Signals for the users app."""

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from access.constants import ROLE_ADMIN
from access.models import RoleDefinition
from org.models import Org
from user_role.models import UserRole

from .models import User


@receiver(post_save, sender=User)
def provision_org_for_new_registration(sender, instance: User, created: bool, **kwargs) -> None:
    """
    When registration sets `_provision_org` on the user before save, create a new org
    and make this user `org_admin`. Admin-created users should not set this flag.
    """
    if not created:
        return
    if not getattr(instance, '_provision_org', False):
        return
    if UserRole.objects.filter(user=instance).exists():
        return

    org_name = getattr(instance, '_org_name', None) or 'My organization'
    org = Org.objects.create(
        name=org_name[:255],
        org_type=getattr(settings, 'DEFAULT_NEW_ORG_TYPE', 'property_manager'),
    )
    admin_role = RoleDefinition.objects.get(org=org, key=ROLE_ADMIN)
    UserRole.objects.create(user=instance, org=org, role_definition=admin_role)
