"""Shared helpers for report stubs and live reports."""

from __future__ import annotations

from decimal import Decimal
from typing import Any


def stub_payload(*, slug: str, org_id: int, **extra: Any) -> dict[str, Any]:
    """Uniform stub response until real aggregation is implemented."""
    out: dict[str, Any] = {
        'slug': slug,
        'org_id': org_id,
        'status': 'stub',
        'rows': [],
    }
    out.update(extra)
    return out


def decimal_str(value: Decimal | float | int | None) -> str:
    """JSON-safe monetary string (avoids float drift)."""
    if value is None:
        return '0.00'
    if isinstance(value, Decimal):
        q = value.quantize(Decimal('0.01'))
        return format(q, 'f')
    return format(Decimal(str(value)).quantize(Decimal('0.01')), 'f')
