"""Billing period boundaries for invoice issuance (calendar-aligned where noted)."""

from __future__ import annotations

import calendar
from collections.abc import Iterator
from datetime import date, timedelta


def _month_end(y: int, m: int) -> date:
    last = calendar.monthrange(y, m)[1]
    return date(y, m, last)


def norm_cycle(cycle: str) -> str:
    return (cycle or 'monthly').strip().lower()


def lease_covers_period(
    lease_start: date,
    lease_end: date | None,
    period_start: date,
    period_end: date,
) -> bool:
    if period_end < lease_start:
        return False
    if lease_end is not None and lease_end < period_start:
        return False
    return True


def iter_billing_periods(
    lease_start: date,
    lease_end: date | None,
    as_of: date,
    cycle: str,
) -> Iterator[tuple[date, date]]:
    """
    Iterate billing periods overlapping the lease, oldest first.
    Only periods with period_end <= as_of are yielded (no future/partial periods).
    """
    c = norm_cycle(cycle)
    if c == 'daily':
        yield from _iter_daily(lease_start, lease_end, as_of)
    elif c == 'weekly':
        yield from _iter_weekly(lease_start, lease_end, as_of)
    elif c == 'monthly':
        yield from _iter_monthly(lease_start, lease_end, as_of)
    elif c == 'quarterly':
        yield from _iter_quarterly(lease_start, lease_end, as_of)
    elif c == 'annually':
        yield from _iter_annually(lease_start, lease_end, as_of)
    else:
        yield from _iter_monthly(lease_start, lease_end, as_of)


def _iter_daily(
    lease_start: date,
    lease_end: date | None,
    as_of: date,
) -> Iterator[tuple[date, date]]:
    d = lease_start
    while d <= as_of:
        if lease_end is not None and d > lease_end:
            break
        yield (d, d)
        d += timedelta(days=1)


def _iter_weekly(
    lease_start: date,
    lease_end: date | None,
    as_of: date,
) -> Iterator[tuple[date, date]]:
    start = lease_start
    while start <= as_of:
        if lease_end is not None and start > lease_end:
            break
        end = start + timedelta(days=6)
        if end > as_of:
            break
        if lease_covers_period(lease_start, lease_end, start, end):
            yield (start, end)
        start += timedelta(days=7)


def _iter_monthly(
    lease_start: date,
    lease_end: date | None,
    as_of: date,
) -> Iterator[tuple[date, date]]:
    y, m = lease_start.year, lease_start.month
    end_ym = as_of.year * 12 + as_of.month
    while True:
        cur = y * 12 + m
        if cur > end_ym:
            break
        ps = date(y, m, 1)
        pe = _month_end(y, m)
        if pe > as_of:
            break
        if lease_covers_period(lease_start, lease_end, ps, pe):
            yield (ps, pe)
        if m == 12:
            y += 1
            m = 1
        else:
            m += 1


def _quarter_start_end(year: int, q: int) -> tuple[date, date]:
    if q == 1:
        return date(year, 1, 1), date(year, 3, 31)
    if q == 2:
        return date(year, 4, 1), date(year, 6, 30)
    if q == 3:
        return date(year, 7, 1), date(year, 9, 30)
    return date(year, 10, 1), date(year, 12, 31)


def _iter_quarterly(
    lease_start: date,
    lease_end: date | None,
    as_of: date,
) -> Iterator[tuple[date, date]]:
    y = lease_start.year
    q = (lease_start.month - 1) // 3 + 1
    while y <= as_of.year + 1:
        ps, pe = _quarter_start_end(y, q)
        if pe > as_of:
            break
        if lease_covers_period(lease_start, lease_end, ps, pe) and pe <= as_of:
            yield (ps, pe)
        if q < 4:
            q += 1
        else:
            q = 1
            y += 1


def _iter_annually(
    lease_start: date,
    lease_end: date | None,
    as_of: date,
) -> Iterator[tuple[date, date]]:
    y = lease_start.year
    while y <= as_of.year + 1:
        ps = date(y, 1, 1)
        pe = date(y, 12, 31)
        if pe > as_of:
            break
        if lease_covers_period(lease_start, lease_end, ps, pe):
            yield (ps, pe)
        y += 1
