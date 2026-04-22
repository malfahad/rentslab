"""Occupancy / vacancy report — slug: occupancy-vacancy."""

from __future__ import annotations

from typing import Any

from .base import stub_payload

SLUG = 'occupancy-vacancy'


def lookup(*, org_id: int, params: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, Any]:
    """Return report payload for this org (stub)."""
    return stub_payload(slug=SLUG, org_id=org_id, params=params or {})
