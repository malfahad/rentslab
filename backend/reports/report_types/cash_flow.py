"""Cash flow report — slug: cash-flow.

Cash-basis: tenant payments as inflows; expenses counted when paid
(``paid_at`` in range, or ``status=paid`` with ``expense_date`` in range when
``paid_at`` is unset).
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.db.models import Q, Sum

from expense.models import Expense
from payment.models import Payment

from .base import decimal_str
from .period import parse_report_period

SLUG = 'cash-flow'


def lookup(*, org_id: int, params: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, Any]:
    start, end = parse_report_period(params)

    payments_qs = Payment.objects.filter(
        org_id=org_id,
        payment_date__date__gte=start,
        payment_date__date__lte=end,
    )
    cash_in_total = payments_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    cash_in_by_method: list[dict[str, str]] = []
    for row in payments_qs.values('method').annotate(total=Sum('amount')):
        method = row.get('method') or 'unknown'
        cash_in_by_method.append(
            {
                'method': method,
                'amount': decimal_str(row['total'] or Decimal('0')),
            }
        )
    cash_in_by_method.sort(key=lambda x: x['method'])

    payment_count = payments_qs.count()

    # Cash out: paid expenses in period
    paid_filter = Q(
        paid_at__isnull=False,
        paid_at__date__gte=start,
        paid_at__date__lte=end,
    )
    legacy_paid_filter = Q(
        paid_at__isnull=True,
        status='paid',
        expense_date__gte=start,
        expense_date__lte=end,
    )
    expense_out_qs = Expense.objects.filter(org_id=org_id).filter(
        paid_filter | legacy_paid_filter
    ).exclude(status='draft')

    cash_out_total = expense_out_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    cash_out_by_category: list[dict[str, str]] = []
    for row in expense_out_qs.values('expense_category__name').annotate(total=Sum('amount')):
        name = row.get('expense_category__name') or 'Uncategorized'
        cash_out_by_category.append(
            {
                'category': name,
                'amount': decimal_str(row['total'] or Decimal('0')),
            }
        )
    cash_out_by_category.sort(key=lambda x: x['category'])

    expense_out_count = expense_out_qs.count()

    net_cash = cash_in_total - cash_out_total

    return {
        'slug': SLUG,
        'org_id': org_id,
        'status': 'ok',
        'basis': 'cash',
        'period': {
            'start': start.isoformat(),
            'end': end.isoformat(),
        },
        'cash_in': {
            'total': decimal_str(cash_in_total),
            'payment_count': payment_count,
            'by_method': cash_in_by_method,
        },
        'cash_out': {
            'total': decimal_str(cash_out_total),
            'expense_count': expense_out_count,
            'by_category': cash_out_by_category,
        },
        'net_cash_flow': decimal_str(net_cash),
        'rows': [],
    }
