from django.conf import settings
from django.db import models


class UserRole(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_roles',
    )
    org = models.ForeignKey('org.Org', on_delete=models.CASCADE, related_name='user_roles')
    role_definition = models.ForeignKey(
        'access.RoleDefinition',
        on_delete=models.PROTECT,
        related_name='user_roles',
    )
    role = models.CharField(
        max_length=64,
        blank=True,
        help_text='Denormalized role key (schema user_role.role); synced from role_definition.key.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_role'
        constraints = [
            models.UniqueConstraint(fields=['user', 'org'], name='uniq_user_role_per_org'),
        ]
        indexes = [
            models.Index(fields=['org'], name='user_role_org_idx'),
        ]

    def save(self, *args, **kwargs):
        if self.role_definition_id:
            self.role = self.role_definition.key
        super().save(*args, **kwargs)
