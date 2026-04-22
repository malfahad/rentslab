"""Cash flow report — slug: cash-flow.

Cash-basis: tenant payments as inflows; expenses counted when paid
(``paid_at`` in range, or ``status=paid`` with ``expense_date`` in range when
``paid_at`` is unset).
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.db.models import Q

from expense.models import Expense
from org.models import Org
from payment.models import Payment

from .base import decimal_str
from .currency_utils import convert_to_default
from .period import parse_report_period

SLUG = 'cash-flow'


def lookup(*, org_id: int, params: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, Any]:
    start, end = parse_report_period(params)
    org = Org.objects.filter(pk=org_id).only('default_currency').first()
    default_currency = ((org.default_currency if org else 'KES') or 'KES').upper()

    payments_qs = Payment.objects.filter(
        org_id=org_id,
        payment_date__date__gte=start,
        payment_date__date__lte=end,
    )
    cash_in_total = Decimal('0')
    cash_in_by_method_totals: dict[str, Decimal] = {}
    for p in payments_qs:
        amt = p.amount or Decimal('0')
        cash_in_total += amt
        method = p.method or 'unknown'
        cash_in_by_method_totals[method] = cash_in_by_method_totals.get(method, Decimal('0')) + amt

    cash_in_by_method: list[dict[str, str]] = []
    for method, total in cash_in_by_method_totals.items():
        cash_in_by_method.append(
            {
                'method': method,
                'amount': decimal_str(total),
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
    ).exclude(status='draft').select_related('expense_category')
    cash_out_total = Decimal('0')

    cash_out_by_category: list[dict[str, str]] = []
    by_category_totals: dict[str, Decimal] = {}
    for exp in expense_out_qs:
        name = (exp.expense_category.name if exp.expense_category_id else 'Uncategorized') or 'Uncategorized'
        src_currency = ((exp.currency_code or default_currency)).upper()
        converted = convert_to_default(exp.amount or Decimal('0'), src_currency, default_currency)
        by_category_totals[name] = by_category_totals.get(name, Decimal('0')) + converted
        cash_out_total += converted
    for name, total in by_category_totals.items():
        cash_out_by_category.append(
            {
                'category': name,
                'amount': decimal_str(total),
            }
        )
    cash_out_by_category.sort(key=lambda x: x['category'])

    expense_out_count = expense_out_qs.count()

    net_cash = cash_in_total - cash_out_total

    return {
        'slug': SLUG,
        'org_id': org_id,
        'status': 'ok',
        'report_currency': default_currency,
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
