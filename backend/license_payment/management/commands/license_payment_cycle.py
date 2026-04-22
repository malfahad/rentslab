import json

from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_date

from license_payment.models import LicensePayment
from license_payment.services import (
    MONTHLY_RATE,
    YEARLY_RATE,
    compute_amount_due,
    current_org_units_count,
    monthly_period,
    yearly_period,
)
from org.models import Org
from tenant.models import Tenant


class Command(BaseCommand):
    help = 'Create or edit a license payment cycle for an organization.'

    def add_arguments(self, parser):
        parser.add_argument('--org-id', type=int, required=True, help='Organization ID')
        parser.add_argument('--tenant-id', type=int, default=0, help='Optional tenant ID')
        parser.add_argument('--mode', type=str, default='monthly', choices=['monthly', 'yearly'])
        parser.add_argument('--cycle-year', type=int, required=True)
        parser.add_argument('--cycle-month', type=int, default=0, help='1-12 for monthly mode')
        parser.add_argument('--status', type=str, default='upcoming', choices=['upcoming', 'due', 'paid', 'void'])
        parser.add_argument('--unit-price', type=str, default='')
        parser.add_argument('--units-count', type=int, default=-1, help='Default: current org units')
        parser.add_argument('--credit-balance', type=str, default='0.00')
        parser.add_argument('--period-start', type=str, default='')
        parser.add_argument('--period-end', type=str, default='')
        parser.add_argument('--notes', type=str, default='')

    def handle(self, *args, **options):
        org = Org.objects.get(pk=options['org_id'])
        tenant = None
        if options['tenant_id']:
            tenant = Tenant.objects.get(pk=options['tenant_id'], org_id=org.id)

        mode = options['mode']
        year = options['cycle_year']
        month = options['cycle_month'] or None
        if mode == LicensePayment.MODE_MONTHLY and (month is None or month < 1 or month > 12):
            self.stderr.write(self.style.ERROR('--cycle-month must be 1..12 in monthly mode'))
            return
        if mode == LicensePayment.MODE_YEARLY:
            month = None

        if options['period_start'] and options['period_end']:
            period_start = parse_date(options['period_start'])
            period_end = parse_date(options['period_end'])
            if period_start is None or period_end is None:
                self.stderr.write(self.style.ERROR('Invalid period dates, use YYYY-MM-DD'))
                return
        else:
            period_start, period_end = monthly_period(year, month) if mode == 'monthly' else yearly_period(year)

        unit_price = options['unit_price'] or (str(MONTHLY_RATE) if mode == 'monthly' else str(YEARLY_RATE))
        units_count = options['units_count'] if options['units_count'] >= 0 else current_org_units_count(org.id)
        amount_due = compute_amount_due(units_count, unit_price)

        obj, created = LicensePayment.objects.update_or_create(
            org=org,
            mode=mode,
            cycle_year=year,
            cycle_month=month,
            defaults={
                'tenant': tenant,
                'period_start': period_start,
                'period_end': period_end,
                'status': options['status'],
                'units_count': units_count,
                'unit_price': unit_price,
                'amount_due': amount_due,
                'credit_balance': options['credit_balance'],
                'notes': options['notes'],
            },
        )
        payload = {
            'id': obj.id,
            'created': created,
            'org_id': obj.org_id,
            'tenant_id': obj.tenant_id,
            'mode': obj.mode,
            'cycle_year': obj.cycle_year,
            'cycle_month': obj.cycle_month,
            'status': obj.status,
            'units_count': obj.units_count,
            'unit_price': str(obj.unit_price),
            'amount_due': str(obj.amount_due),
            'credit_balance': str(obj.credit_balance),
            'period_start': obj.period_start.isoformat(),
            'period_end': obj.period_end.isoformat(),
        }
        self.stdout.write(json.dumps(payload, indent=2))
