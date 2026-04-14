"""Roll up linked expenses into ``JobOrder.actual_cost``."""

from __future__ import annotations

from decimal import Decimal

from django.db.models import Sum


def refresh_job_order_actual_cost(job_order_id: int) -> None:
    """
    Set ``actual_cost`` to the sum of linked expenses excluding draft/rejected.
    """
    from expense.models import Expense

    from ..models import JobOrder

    total = (
        Expense.objects.filter(job_order_id=job_order_id)
        .exclude(status__in=['draft', 'rejected'])
        .aggregate(s=Sum('amount'))['s']
    )
    JobOrder.objects.filter(pk=job_order_id).update(
        actual_cost=total if total is not None else Decimal('0.00'),
    )
