"""Property performance report — slug: property-performance."""

from __future__ import annotations

from typing import Any

from .base import stub_payload

SLUG = 'property-performance'


def lookup(*, org_id: int, params: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, Any]:
    """Return report payload for this org (stub)."""
    return stub_payload(slug=SLUG, org_id=org_id, params=params or {})
