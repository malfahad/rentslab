"""Automated invoice issuance: missed billing periods consolidated per lease."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.db.models import Prefetch
from django.utils import timezone

from invoice.constants import DEFAULT_INVOICE_DUE_DAYS, MAX_ISSUANCE_PERIODS_PER_LEASE
from invoice.models import Invoice
from invoice.services.periods import iter_billing_periods, norm_cycle
from invoice_line_item.models import InvoiceLineItem
from lease.models import Lease
from service_subscription.models import ServiceSubscription

logger = logging.getLogger(__name__)


def _period_label(ps: date, pe: date) -> str:
    if ps == pe:
        return ps.isoformat()
    return f'{ps.isoformat()} — {pe.isoformat()}'


def _existing_automated_keys(lease_id: int) -> set[tuple[Any, ...]]:
    rows = InvoiceLineItem.objects.filter(
        invoice__lease_id=lease_id,
        billing_period_start__isnull=False,
        billing_period_end__isnull=False,
    ).values_list('billing_period_start', 'billing_period_end', 'line_kind', 'service_id')
    return set(rows)


def _subscription_covers_period(
    sub: ServiceSubscription,
    period_start: date,
    period_end: date,
) -> bool:
    sf = sub.effective_from
    st = sub.effective_to
    if sf is not None and period_end < sf:
        return False
    if st is not None and period_start > st:
        return False
    return True


def _bill_to_fields(lease: Lease) -> dict[str, str]:
    tenant = lease.tenant
    name = tenant.name or ''
    if lease.billing_same_as_tenant_address:
        return {
            'bill_to_name': name,
            'bill_to_address_line1': tenant.address_line1 or '',
            'bill_to_address_line2': tenant.address_line2 or '',
            'bill_to_city': tenant.city or '',
            'bill_to_region': tenant.region or '',
            'bill_to_postal_code': tenant.postal_code or '',
            'bill_to_country_code': tenant.country_code or '',
            'bill_to_tax_id': tenant.tax_id or '',
        }
    return {
        'bill_to_name': name,
        'bill_to_address_line1': lease.billing_address_line1 or '',
        'bill_to_address_line2': lease.billing_address_line2 or '',
        'bill_to_city': lease.billing_city or '',
        'bill_to_region': lease.billing_region or '',
        'bill_to_postal_code': lease.billing_postal_code or '',
        'bill_to_country_code': lease.billing_country_code or '',
        'bill_to_tax_id': tenant.tax_id or '',
    }


@dataclass
class IssueInvoicesResult:
    created_invoices: list[int] = field(default_factory=list)
    skipped_leases: list[int] = field(default_factory=list)
    truncated_lease_ids: list[int] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    dry_run: bool = False
    would_create_count: int = 0


def issue_invoices_for_org(
    org_id: int,
    as_of: date | None = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    """
    For each active lease in the org, walk billing periods (oldest first), find missed
    rent/service lines (idempotent via billing_period_* + line_kind), up to
    MAX_ISSUANCE_PERIODS_PER_LEASE periods with work per lease, and create one
    consolidated invoice per lease when there is anything to bill.

    Service subscriptions are included only when their billing_cycle matches the lease's.
    """
    if as_of is None:
        as_of = timezone.now().date()

    result = IssueInvoicesResult(dry_run=dry_run)

    leases = (
        Lease.objects.filter(
            unit__building__org_id=org_id,
            status='active',
        )
        .select_related('tenant', 'unit', 'unit__building')
        .prefetch_related(
            Prefetch(
                'service_subscriptions',
                queryset=ServiceSubscription.objects.select_related('service'),
            )
        )
        .order_by('id')
    )

    for lease in leases:
        try:
            _process_lease(lease, org_id, as_of, dry_run, result)
        except Exception as e:
            msg = f'Lease {lease.pk}: {e}'
            logger.exception('issue_invoices lease %s', lease.pk)
            result.errors.append(msg)

    return {
        'created_invoices': result.created_invoices,
        'created_count': len(result.created_invoices),
        'skipped_leases': result.skipped_leases,
        'truncated_lease_ids': result.truncated_lease_ids,
        'errors': result.errors,
        'dry_run': result.dry_run,
        'would_create_count': result.would_create_count,
    }


def _process_lease(
    lease: Lease,
    org_id: int,
    as_of: date,
    dry_run: bool,
    result: IssueInvoicesResult,
) -> None:
    existing = _existing_automated_keys(lease.pk)
    subs = list(lease.service_subscriptions.all())
    lease_cycle = norm_cycle(lease.billing_cycle)

    lines: list[dict[str, Any]] = []
    periods_with_work = 0
    truncated = False

    for ps, pe in iter_billing_periods(
        lease.start_date,
        lease.end_date,
        as_of,
        lease.billing_cycle,
    ):
        period_lines: list[dict[str, Any]] = []

        rent_key = (ps, pe, InvoiceLineItem.LINE_KIND_RENT, None)
        if rent_key not in existing and lease.rent_amount and lease.rent_amount > Decimal('0'):
            rc = (lease.rent_currency or '').strip() or '—'
            period_lines.append(
                {
                    'description': f'Rent — {_period_label(ps, pe)} ({rc})',
                    'amount': lease.rent_amount,
                    'service_id': None,
                    'period_start': ps,
                    'period_end': pe,
                    'kind': InvoiceLineItem.LINE_KIND_RENT,
                }
            )

        for sub in subs:
            if norm_cycle(sub.billing_cycle) != lease_cycle:
                continue
            if not _subscription_covers_period(sub, ps, pe):
                continue
            sk = (ps, pe, InvoiceLineItem.LINE_KIND_SERVICE, sub.service_id)
            if sk in existing:
                continue
            rate = sub.rate
            if rate is None or rate <= Decimal('0'):
                continue
            sc = (sub.currency or '').strip() or (sub.service.currency or '').strip() or '—'
            period_lines.append(
                {
                    'description': f'{sub.service.name} — {_period_label(ps, pe)} ({sc})',
                    'amount': rate,
                    'service_id': sub.service_id,
                    'period_start': ps,
                    'period_end': pe,
                    'kind': InvoiceLineItem.LINE_KIND_SERVICE,
                }
            )

        if not period_lines:
            continue

        if periods_with_work >= MAX_ISSUANCE_PERIODS_PER_LEASE:
            truncated = True
            break

        periods_with_work += 1
        lines.extend(period_lines)

    if truncated:
        result.truncated_lease_ids.append(lease.pk)

    if not lines:
        result.skipped_leases.append(lease.pk)
        return

    if dry_run:
        result.would_create_count += 1
        return

    _persist_invoice(lease, org_id, as_of, lines, result)


def _persist_invoice(
    lease: Lease,
    org_id: int,
    as_of: date,
    lines: list[dict[str, Any]],
    result: IssueInvoicesResult,
) -> None:
    total = sum((Decimal(str(x['amount'])) for x in lines), Decimal('0.00'))
    bill_to = _bill_to_fields(lease)

    with transaction.atomic():
        inv = Invoice.objects.create(
            lease=lease,
            org_id=org_id,
            invoice_number='',
            issue_date=as_of,
            due_date=as_of + timedelta(days=DEFAULT_INVOICE_DUE_DAYS),
            total_amount=total,
            status='unpaid',
            issue_kind='catch_up',
            **bill_to,
        )
        inv.invoice_number = f'{org_id}-{inv.id:06d}'
        inv.save(update_fields=['invoice_number'])

        for i, row in enumerate(lines, start=1):
            InvoiceLineItem.objects.create(
                invoice=inv,
                line_number=i,
                description=row['description'],
                amount=row['amount'],
                service_id=row['service_id'],
                billing_period_start=row['period_start'],
                billing_period_end=row['period_end'],
                line_kind=row['kind'],
            )

    result.created_invoices.append(inv.pk)
