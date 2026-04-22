"""Income statement (profit & loss) — slug: income-statement.

Accrual-style view for the period: revenue from invoices (issue date),
expenses by category (expense date, non-draft), credit notes as revenue
reductions (credit date).
"""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal
from typing import Any

from credit_note.models import CreditNote
from expense.models import Expense
from invoice.models import Invoice
from invoice_line_item.models import InvoiceLineItem
from org.models import Org

from .base import decimal_str
from .currency_utils import convert_to_default
from .period import parse_report_period

SLUG = 'income-statement'


def lookup(*, org_id: int, params: dict[str, Any] | None = None, **kwargs: Any) -> dict[str, Any]:
    start, end = parse_report_period(params)
    org = Org.objects.filter(pk=org_id).only('default_currency').first()
    default_currency = ((org.default_currency if org else 'KES') or 'KES').upper()

    invoices_qs = Invoice.objects.filter(
        org_id=org_id,
        issue_date__gte=start,
        issue_date__lte=end,
    ).select_related('lease')
    invoice_count = invoices_qs.count()

    # Revenue by line kind (invoice line items on invoices in period)
    by_kind: defaultdict[str, Decimal] = defaultdict(Decimal)
    invoices_total = Decimal('0')
    line_items_qs = (
        InvoiceLineItem.objects.filter(
            invoice__org_id=org_id,
            invoice__issue_date__gte=start,
            invoice__issue_date__lte=end,
        )
        .select_related('invoice__lease', 'service')
        .order_by('invoice_id', 'id')
    )
    seen_invoices_with_lines: set[int] = set()
    for li in line_items_qs:
        seen_invoices_with_lines.add(li.invoice_id)
        raw = (li.line_kind or '').strip()
        kind = raw if raw else 'other'
        src_currency = default_currency
        if kind == InvoiceLineItem.LINE_KIND_RENT:
            src_currency = (
                (getattr(getattr(li.invoice, 'lease', None), 'rent_currency', '') or default_currency)
                .upper()
            )
        elif kind == InvoiceLineItem.LINE_KIND_SERVICE and li.service_id:
            src_currency = (li.service.currency or default_currency).upper()
        amount = convert_to_default(li.amount or Decimal('0'), src_currency, default_currency)
        by_kind[kind] += amount
        invoices_total += amount

    # Legacy/fallback invoices without line items
    for inv in invoices_qs:
        if inv.id in seen_invoices_with_lines:
            continue
        src_currency = ((getattr(inv.lease, 'rent_currency', '') or default_currency)).upper()
        invoices_total += convert_to_default(inv.total_amount or Decimal('0'), src_currency, default_currency)

    revenue_by_line_kind = [
        {'line_kind': k, 'amount': decimal_str(v)}
        for k, v in sorted(by_kind.items(), key=lambda x: x[0])
    ]

    credit_qs = CreditNote.objects.filter(
        invoice__org_id=org_id,
        credit_date__gte=start,
        credit_date__lte=end,
    ).select_related('invoice__lease')
    credit_notes_total = Decimal('0')
    for cn in credit_qs:
        src_currency = (
            (getattr(getattr(cn.invoice, 'lease', None), 'rent_currency', '') or default_currency).upper()
        )
        credit_notes_total += convert_to_default(cn.amount or Decimal('0'), src_currency, default_currency)

    net_revenue = invoices_total - credit_notes_total

    expense_qs = Expense.objects.filter(
        org_id=org_id,
        expense_date__gte=start,
        expense_date__lte=end,
    ).exclude(status='draft').select_related('expense_category')

    expenses_total = Decimal('0')

    by_category: list[dict[str, Any]] = []
    by_category_totals: defaultdict[str, Decimal] = defaultdict(Decimal)
    for exp in expense_qs:
        name = (exp.expense_category.name if exp.expense_category_id else 'Uncategorized') or 'Uncategorized'
        src_currency = ((exp.currency_code or default_currency)).upper()
        converted = convert_to_default(exp.amount or Decimal('0'), src_currency, default_currency)
        by_category_totals[name] += converted
        expenses_total += converted
    for name, total in by_category_totals.items():
        by_category.append({'category': name, 'amount': decimal_str(total)})
    by_category.sort(key=lambda x: x['category'])

    net_income = net_revenue - expenses_total

    return {
        'slug': SLUG,
        'org_id': org_id,
        'status': 'ok',
        'report_currency': default_currency,
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
