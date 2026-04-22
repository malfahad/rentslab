import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """Staff / back-office user. Registration provisions an org via signal."""

    email = models.EmailField('email address', unique=True)
    name = models.CharField(
        max_length=255,
        blank=True,
        help_text='Display / full name (schema: user.name).',
    )
    phone = models.CharField(max_length=64, blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=128, blank=True)
    region = models.CharField(max_length=128, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    country_code = models.CharField(max_length=2, blank=True)
    contact_info = models.JSONField(null=True, blank=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users_user'

    def soft_delete(self) -> None:
        """Deactivate and anonymize email so the address can be re-registered."""
        self.is_active = False
        self.deleted_at = timezone.now()
        self.email = f'deleted_{self.pk}_{uuid.uuid4().hex}@invalid.local'
        self.save()


class AccessRequest(models.Model):
    """Email capture for invite-only beta onboarding."""

    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'access_requests'
        ordering = ['-created_at']
