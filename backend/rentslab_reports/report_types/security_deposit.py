"""Security deposit report — slug: security-deposit."""

from __future__ import annotations

from typing import Any

from .base import stub_payload

SLUG = 'security-deposit'


def lookup(*, org_id: int, params: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, Any]:
    """Return report payload for this org (stub)."""
    return stub_payload(slug=SLUG, org_id=org_id, params=params or {})
