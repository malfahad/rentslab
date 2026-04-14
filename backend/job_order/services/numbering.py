"""Unique human-readable job numbers per organization."""

from __future__ import annotations


def next_job_number(org_id: int) -> str:
    """
    Allocate ``JO-{org_id}-{seq}`` with seq one higher than the max existing suffix
    for that prefix (best-effort; callers should create inside a transaction).
    """
    from ..models import JobOrder

    prefix = f'JO-{org_id}-'
    existing = JobOrder.objects.filter(org_id=org_id, job_number__startswith=prefix).values_list(
        'job_number',
        flat=True,
    )
    n = 0
    for jn in existing:
        try:
            part = jn.rsplit('-', 1)[-1]
            n = max(n, int(part))
        except (ValueError, IndexError):
            continue
    return f'{prefix}{n + 1:05d}'
