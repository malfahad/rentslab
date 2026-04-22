"""Rent roll report — slug: rent-roll.

Active leases for the org with unit, building, tenant, and scheduled rent.
``asOf`` / ``as_of`` (or ``periodEnd``) selects the reporting date; defaults
to today.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.db.models import Q, Sum

from lease.models import Lease

from .base import decimal_str
from .period import parse_as_of_date

SLUG = 'rent-roll'


def lookup(*, org_id: int, params: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, Any]:
    as_of = parse_as_of_date(params)

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
    for lease in qs:
        b = lease.unit.building
        rows.append(
            {
                'building_id': b.id,
                'building_name': b.name,
                'unit_id': lease.unit.id,
                'unit_number': lease.unit.unit_number,
                'tenant_id': lease.tenant.id,
                'tenant_name': lease.tenant.name,
                'lease_id': lease.id,
                'rent_amount': decimal_str(lease.rent_amount),
                'rent_currency': lease.rent_currency or '',
                'billing_cycle': lease.billing_cycle,
                'lease_start': lease.start_date.isoformat(),
                'lease_end': lease.end_date.isoformat() if lease.end_date else None,
            }
        )

    total_scheduled = qs.aggregate(total=Sum('rent_amount'))['total'] or Decimal('0')

    return {
        'slug': SLUG,
        'org_id': org_id,
        'status': 'ok',
        'as_of': as_of.isoformat(),
        'lease_count': len(rows),
        'total_scheduled_rent': decimal_str(total_scheduled),
        'rows': rows,
    }
