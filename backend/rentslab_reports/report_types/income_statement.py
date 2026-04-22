"""Income statement (profit & loss) — slug: income-statement.

Accrual-style view for the period: revenue from invoices (issue date),
expenses by category (expense date, non-draft), credit notes as revenue
reductions (credit date).
"""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal
from typing import Any

from django.db.models import Sum

from credit_note.models import CreditNote
from expense.models import Expense
from invoice.models import Invoice
from invoice_line_item.models import InvoiceLineItem

from .base import decimal_str
from .period import parse_report_period

SLUG = 'income-statement'


def lookup(*, org_id: int, params: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, Any]:
    start, end = parse_report_period(params)

    invoices_agg = Invoice.objects.filter(
        org_id=org_id,
        issue_date__gte=start,
        issue_date__lte=end,
    ).aggregate(total=Sum('total_amount'))
    invoices_total = invoices_agg['total'] or Decimal('0')

    invoice_count = Invoice.objects.filter(
        org_id=org_id,
        issue_date__gte=start,
        issue_date__lte=end,
    ).count()

    # Revenue by line kind (invoice line items on invoices in period)
    by_kind: defaultdict[str, Decimal] = defaultdict(Decimal)
    for row in (
        InvoiceLineItem.objects.filter(
            invoice__org_id=org_id,
            invoice__issue_date__gte=start,
            invoice__issue_date__lte=end,
        )
        .values('line_kind')
        .annotate(total=Sum('amount'))
    ):
        raw = (row.get('line_kind') or '').strip()
        kind = raw if raw else 'other'
        by_kind[kind] += row['total'] or Decimal('0')

    revenue_by_line_kind = [
        {'line_kind': k, 'amount': decimal_str(v)}
        for k, v in sorted(by_kind.items(), key=lambda x: x[0])
    ]

    credit_agg = CreditNote.objects.filter(
        invoice__org_id=org_id,
        credit_date__gte=start,
        credit_date__lte=end,
    ).aggregate(total=Sum('amount'))
    credit_notes_total = credit_agg['total'] or Decimal('0')

    net_revenue = invoices_total - credit_notes_total

    expense_qs = Expense.objects.filter(
        org_id=org_id,
        expense_date__gte=start,
        expense_date__lte=end,
    ).exclude(status='draft')

    expenses_total = expense_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')

    by_category: list[dict[str, Any]] = []
    for row in expense_qs.values('expense_category__name').annotate(total=Sum('amount')):
        name = row.get('expense_category__name') or 'Uncategorized'
        by_category.append(
            {
                'category': name,
                'amount': decimal_str(row['total'] or Decimal('0')),
            }
        )
    by_category.sort(key=lambda x: x['category'])

    net_income = net_revenue - expenses_total

    return {
        'slug': SLUG,
        'org_id': org_id,
        'status': 'ok',
        'basis': 'accrual',
        'period': {
            'start': start.isoformat(),
            'end': end.isoformat(),
        },
        'revenue': {
            'invoices_total': decimal_str(invoices_total),
            'invoice_count': invoice_count,
            'by_line_kind': revenue_by_line_kind,
            'credit_notes_total': decimal_str(credit_notes_total),
            'net_revenue': decimal_str(net_revenue),
        },
        'expenses': {
            'total': decimal_str(expenses_total),
            'by_category': by_category,
        },
        'net_income': decimal_str(net_income),
        'rows': [],
    }
