from django.conf import settings
from django.db import models

from access.constants import PERM_MANAGE, PERM_VIEW


class RoleDefinition(models.Model):
    """
    Org-scoped role. System roles (`admin`, `org_member`) cannot be deleted.
    Admins may create additional custom roles.
    """

    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='role_definitions')
    key = models.SlugField(max_length=64)
    name = models.CharField(max_length=128)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'access_role_definition'
        constraints = [
            models.UniqueConstraint(fields=['org', 'key'], name='uniq_role_key_per_org'),
        ]

    def __str__(self) -> str:
        return f'{self.org_id}:{self.key}'


class ShareGrant(models.Model):
    """
    Fine-grained share: grant VIEW or MANAGE on a scope/object to a user within an org.
    `object_id` null with scope ORG means org-wide ALL.
    """

    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='share_grants')
    scope = models.CharField(max_length=32)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    grantee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='share_grants_received',
    )
    permission_level = models.CharField(max_length=16)
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='share_grants_granted',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'access_share_grant'
        constraints = [
            models.UniqueConstraint(
                fields=['org', 'scope', 'object_id', 'grantee', 'permission_level'],
                name='uniq_share_grant_tuple',
            ),
        ]

    def implies_view(self) -> bool:
        return self.permission_level in (PERM_VIEW, PERM_MANAGE)
