"""Parse ``periodStart`` / ``periodEnd`` query params (ISO dates)."""

from __future__ import annotations

from calendar import monthrange
from datetime import date
from typing import Any

from django.utils.dateparse import parse_date


def parse_report_period(params: dict[str, Any] | None) -> tuple[date, date]:
    """
    Read ``periodStart`` / ``periodEnd`` (or ``period_start`` / ``period_end``).
    Defaults to the current calendar month when missing or invalid.
    """
    params = params or {}
    raw_start = params.get('periodStart') or params.get('period_start')
    raw_end = params.get('periodEnd') or params.get('period_end')
    start = parse_date(raw_start) if isinstance(raw_start, str) else None
    end = parse_date(raw_end) if isinstance(raw_end, str) else None
    if start is None or end is None:
        today = date.today()
        start = date(today.year, today.month, 1)
        last = monthrange(today.year, today.month)[1]
        end = date(today.year, today.month, last)
    if start > end:
        start, end = end, start
    return start, end


def parse_as_of_date(params: dict[str, Any] | None) -> date:
    """Single date for point-in-time reports (e.g. rent roll). Defaults to today."""
    params = params or {}
    raw = params.get('asOf') or params.get('as_of') or params.get('periodEnd') or params.get('period_end')
    if isinstance(raw, str):
        d = parse_date(raw)
        if d is not None:
            return d
    return date.today()
