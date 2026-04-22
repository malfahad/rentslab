"""Rent roll report — slug: rent-roll.

Active leases for the org with unit, building, tenant, and scheduled rent.
``asOf`` / ``as_of`` (or ``periodEnd``) selects the reporting date; defaults
to today.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.db.models import Q

from lease.models import Lease
from org.models import Org

from .base import decimal_str
from ..fx import ALLOWED_REPORT_CURRENCIES, convert_amount
from .period import parse_as_of_date

SLUG = 'rent-roll'


def lookup(*, org_id: int, params: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, Any]:
    as_of = parse_as_of_date(params)
    org = Org.objects.filter(pk=org_id).only('default_currency').first()
    default_currency = ((org.default_currency if org else 'KES') or 'KES').upper()

    # Active leases in effect on as_of
    qs = (
        Lease.objects.filter(
            tenant__org_id=org_id,
            status='active',
            start_date__lte=as_of,
        )
        .filter(Q(end_date__isnull=True) | Q(end_date__gte=as_of))
        .select_related('tenant', 'unit', 'unit__building')
        .order_by('unit__building__name', 'unit__unit_number', 'id')
    )

    rows: list[dict[str, Any]] = []
    total_scheduled = Decimal('0')
    for lease in qs:
        b = lease.unit.building
        rent = lease.rent_amount or Decimal('0')
        src_currency = (lease.rent_currency or default_currency).upper()
        out_currency = src_currency
        original_currency: str | None = None
        if src_currency not in ALLOWED_REPORT_CURRENCIES or src_currency != default_currency:
            rent = convert_amount(rent, src_currency, default_currency)
            out_currency = default_currency
            original_currency = src_currency
        total_scheduled += rent
        rows.append(
            {
                'building_id': b.id,
                'building_name': b.name,
                'unit_id': lease.unit.id,
                'unit_number': lease.unit.unit_number,
                'tenant_id': lease.tenant.id,
                'tenant_name': lease.tenant.name,
                'lease_id': lease.id,
                'rent_amount': decimal_str(rent),
                'rent_currency': out_currency,
                'original_rent_currency': original_currency,
                'billing_cycle': lease.billing_cycle,
                'lease_start': lease.start_date.isoformat(),
                'lease_end': lease.end_date.isoformat() if lease.end_date else None,
            }
        )

    return {
        'slug': SLUG,
        'org_id': org_id,
        'status': 'ok',
        'report_currency': default_currency,
        'as_of': as_of.isoformat(),
        'lease_count': len(rows),
        'total_scheduled_rent': decimal_str(total_scheduled),
        'rows': rows,
    }
