import hashlib
import hmac

from django.conf import settings
from django.db import models


class Lease(models.Model):
    unit = models.ForeignKey('unit.Unit', on_delete=models.CASCADE, related_name='leases')
    tenant = models.ForeignKey('tenant.Tenant', on_delete=models.CASCADE, related_name='leases')
    managed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='managed_leases',
        help_text='Schema: managed_by_user_id',
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    rent_amount = models.DecimalField(max_digits=14, decimal_places=2)
    rent_currency = models.CharField(
        max_length=3,
        blank=True,
        help_text='ISO 4217 code (e.g. USD, KES).',
    )
    deposit_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    deposit_currency = models.CharField(
        max_length=3,
        blank=True,
        help_text='ISO 4217 code for deposit; may match rent_currency.',
    )
    billing_cycle = models.CharField(max_length=32, default='monthly')
    status = models.CharField(max_length=32, default='active')
    billing_same_as_tenant_address = models.BooleanField(default=True)
    billing_address_line1 = models.CharField(max_length=255, blank=True)
    billing_address_line2 = models.CharField(max_length=255, blank=True)
    billing_city = models.CharField(max_length=128, blank=True)
    billing_region = models.CharField(max_length=128, blank=True)
    billing_postal_code = models.CharField(max_length=32, blank=True)
    billing_country_code = models.CharField(max_length=2, blank=True)
    external_reference = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lease'
        indexes = [
            models.Index(fields=['unit'], name='lease_unit_idx'),
            models.Index(fields=['tenant'], name='lease_tenant_idx'),
            models.Index(fields=['managed_by'], name='lease_managed_by_idx'),
            models.Index(fields=['status', 'end_date'], name='lease_status_end_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['unit'],
                condition=models.Q(status='active'),
                name='uniq_active_lease_per_unit',
            ),
        ]

    @staticmethod
    def _public_doc_signature(raw_id: int) -> str:
        digest = hmac.new(
            key=settings.SECRET_KEY.encode('utf-8'),
            msg=f'lease-doc:{raw_id}'.encode('utf-8'),
            digestmod=hashlib.sha256,
        ).hexdigest()
        return digest[:16]

    @classmethod
    def encode_public_doc_id(cls, lease_id: int) -> str:
        base_id = format(lease_id, 'x')
        return f'{base_id}{cls._public_doc_signature(lease_id)}'

    @classmethod
    def decode_public_doc_id(cls, hashed_doc_id: str) -> int | None:
        token = (hashed_doc_id or '').strip().lower()
        if len(token) <= 16:
            return None
        base_id, sig = token[:-16], token[-16:]
        try:
            raw_id = int(base_id, 16)
        except ValueError:
            return None
        if not hmac.compare_digest(sig, cls._public_doc_signature(raw_id)):
            return None
        return raw_id
