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


def preferred_mode_for_org(org: Org) -> str:
    """
    Resolve billing mode preference:
    1) org.settings["license_mode"] when valid
    2) most recent existing cycle mode
    3) monthly default
    """
    settings = org.settings if isinstance(org.settings, dict) else {}
    raw_mode = settings.get('license_mode')
    if raw_mode in {LicensePayment.MODE_MONTHLY, LicensePayment.MODE_YEARLY}:
        return raw_mode
    latest = (
        LicensePayment.objects.filter(org_id=org.id)
        .order_by('-period_start', '-id')
        .only('mode')
        .first()
    )
    if latest is not None:
        return latest.mode
    return LicensePayment.MODE_MONTHLY


def ensure_dynamic_cycles_for_org(org: Org) -> int:
    """
    Backfill and maintain cycles from registration date up to one upcoming cycle.
    Existing rows are preserved; only missing cycle keys are created.
    """
    mode = preferred_mode_for_org(org)
    units = current_org_units_count(org.id)
    today = date.today()
    registered_on = org.created_at.date()
    created = 0

    if mode == LicensePayment.MODE_YEARLY:
        start_year = registered_on.year
        end_year = today.year + 1  # keep one upcoming yearly cycle
        for year in range(start_year, end_year + 1):
            start, end = yearly_period(year)
            status = _status_for_period(start, end, today)
            _, was_created = LicensePayment.objects.get_or_create(
                org_id=org.id,
                mode=LicensePayment.MODE_YEARLY,
                cycle_year=year,
                cycle_month=None,
                defaults={
                    'period_start': start,
                    'period_end': end,
                    'status': status,
                    'units_count': units,
                    'unit_price': YEARLY_RATE,
                    'amount_due': compute_amount_due(units, YEARLY_RATE),
                },
            )
            created += int(was_created)
        return created

    # Monthly default
    cursor = date(registered_on.year, registered_on.month, 1)
    last_target = date(today.year, today.month, 1)
    if today.month == 12:
        last_target = date(today.year + 1, 1, 1)
    else:
        last_target = date(today.year, today.month + 1, 1)

    while cursor <= last_target:
        year, month = cursor.year, cursor.month
        start, end = monthly_period(year, month)
        status = _status_for_period(start, end, today)
        _, was_created = LicensePayment.objects.get_or_create(
            org_id=org.id,
            mode=LicensePayment.MODE_MONTHLY,
            cycle_year=year,
            cycle_month=month,
            defaults={
                'period_start': start,
                'period_end': end,
                'status': status,
                'units_count': units,
                'unit_price': MONTHLY_RATE,
                'amount_due': compute_amount_due(units, MONTHLY_RATE),
            },
        )
        created += int(was_created)
        if month == 12:
            cursor = date(year + 1, 1, 1)
        else:
            cursor = date(year, month + 1, 1)
    return created


def _status_for_period(start: date, end: date, today: date) -> str:
    if start <= today <= end:
        return LicensePayment.STATUS_DUE
    if start > today:
        return LicensePayment.STATUS_UPCOMING
    return LicensePayment.STATUS_PAID


def license_summary_payload(org_id: int) -> dict:
    org = Org.objects.get(pk=org_id)
    ensure_dynamic_cycles_for_org(org)
    sync_org_license_unit_counts(org.id)
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
        'mode': preferred_mode_for_org(org),
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
