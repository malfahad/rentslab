import json

from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_date

from invoice.services import issue_invoices_for_org


class Command(BaseCommand):
    help = (
        'Issue consolidated catch-up invoices for an org (missed billing periods). '
        'See docs/invoice-issuance-plan.md.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--org-id', type=int, required=True, help='Organization ID')
        parser.add_argument(
            '--as-of',
            type=str,
            default='',
            help='Reference date YYYY-MM-DD (default: today)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Compute actions without creating invoices',
        )

    def handle(self, *args, **options):
        org_id = options['org_id']
        as_of_raw = (options['as_of'] or '').strip()
        as_of = parse_date(as_of_raw) if as_of_raw else None
        if as_of_raw and as_of is None:
            self.stderr.write(self.style.ERROR('Invalid --as-of date; use YYYY-MM-DD'))
            return

        result = issue_invoices_for_org(org_id, as_of=as_of, dry_run=options['dry_run'])
        self.stdout.write(json.dumps(result, indent=2, default=str))
