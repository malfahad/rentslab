from __future__ import annotations

from calendar import monthrange
from datetime import date
from decimal import Decimal

from org.models import Org
from unit.models import Unit

from .models import LicensePayment

MONTHLY_RATE = Decimal('0.79')
YEARLY_RATE = Decimal('8.99')


def current_org_units_count(org_id: int) -> int:
    return Unit.objects.filter(building__org_id=org_id).count()


def compute_amount_due(units_count: int, unit_price: Decimal | str) -> Decimal:
    price = unit_price if isinstance(unit_price, Decimal) else Decimal(str(unit_price))
    return (Decimal(units_count) * price).quantize(Decimal('0.01'))


def sync_org_license_unit_counts(org_id: int) -> int:
    """
    Update open (due/upcoming) cycles with current org unit count.
    Returns number of updated rows.
    """
    units = current_org_units_count(org_id)
    updated = 0
    for lp in LicensePayment.objects.filter(
        org_id=org_id,
        status__in=[LicensePayment.STATUS_DUE, LicensePayment.STATUS_UPCOMING],
    ):
        amount_due = compute_amount_due(units, lp.unit_price)
        if lp.units_count != units or lp.amount_due != amount_due:
            lp.units_count = units
            lp.amount_due = amount_due
            lp.save(update_fields=['units_count', 'amount_due', 'updated_at'])
            updated += 1
    return updated


def monthly_period(year: int, month: int) -> tuple[date, date]:
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])
    return start, end


def yearly_period(year: int) -> tuple[date, date]:
    return date(year, 1, 1), date(year, 12, 31)


def license_summary_payload(org_id: int) -> dict:
    org = Org.objects.get(pk=org_id)
    registered_on = org.created_at.date()
    today = date.today()

    base_qs = LicensePayment.objects.filter(
        org_id=org_id,
        period_start__gte=registered_on,
    ).order_by('-period_start', '-id')

    due = base_qs.filter(status=LicensePayment.STATUS_DUE).first()
    upcoming = base_qs.filter(status=LicensePayment.STATUS_UPCOMING).first()
    latest = base_qs.first()
    previous = list(
        base_qs.filter(period_end__lt=today).exclude(status=LicensePayment.STATUS_VOID)[:12]
    )

    current_units = current_org_units_count(org_id)

    return {
        'org_id': org_id,
        'registered_on': registered_on.isoformat(),
        'rates': {
            'monthly_per_unit': str(MONTHLY_RATE),
            'yearly_per_unit': str(YEARLY_RATE),
        },
        'units_count': current_units,
        'credit_balance': str(latest.credit_balance if latest else Decimal('0.00')),
        'upcoming': _serialize_cycle(upcoming),
        'due': _serialize_cycle(due),
        'previous_cycles': [_serialize_cycle(item) for item in previous],
    }


def _serialize_cycle(item: LicensePayment | None) -> dict | None:
    if item is None:
        return None
    return {
        'id': item.id,
        'mode': item.mode,
        'status': item.status,
        'cycle_year': item.cycle_year,
        'cycle_month': item.cycle_month,
        'period_start': item.period_start.isoformat(),
        'period_end': item.period_end.isoformat(),
        'units_count': item.units_count,
        'unit_price': str(item.unit_price),
        'amount_due': str(item.amount_due),
        'credit_balance': str(item.credit_balance),
        'tenant_id': item.tenant_id,
        'tenant_name': item.tenant.name if item.tenant_id else '',
    }
