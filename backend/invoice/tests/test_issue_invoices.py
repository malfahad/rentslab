from datetime import date
from decimal import Decimal

from rest_framework import status

from django.test import TestCase

from invoice.models import Invoice
from invoice.services import issue_invoices_for_org
from invoice_line_item.models import InvoiceLineItem
from test_helpers import auth_client_for_org, create_lease, create_user, create_user_role
from testing_common import DRFTestCase


class IssueInvoicesServiceTests(TestCase):
    def test_monthly_creates_one_invoice_with_three_rent_lines(self):
        lease = create_lease(
            start_date=date(2025, 1, 1),
            billing_cycle='monthly',
            rent_amount=Decimal('500.00'),
        )
        org = lease.unit.building.org
        out = issue_invoices_for_org(org.pk, as_of=date(2025, 3, 31), dry_run=False)
        self.assertEqual(out['created_count'], 1)
        inv = Invoice.objects.get(pk=out['created_invoices'][0])
        self.assertEqual(inv.issue_kind, 'catch_up')
        lines = list(inv.line_items.order_by('line_number'))
        self.assertEqual(len(lines), 3)
        self.assertTrue(all(x.line_kind == InvoiceLineItem.LINE_KIND_RENT for x in lines))
        self.assertEqual(lines[0].billing_period_start, date(2025, 1, 1))

    def test_second_run_skips_fully_invoiced_lease(self):
        lease = create_lease(
            start_date=date(2025, 1, 1),
            billing_cycle='monthly',
            rent_amount=Decimal('100.00'),
        )
        org = lease.unit.building.org
        issue_invoices_for_org(org.pk, as_of=date(2025, 2, 28), dry_run=False)
        out = issue_invoices_for_org(org.pk, as_of=date(2025, 2, 28), dry_run=False)
        self.assertEqual(out['created_count'], 0)
        self.assertIn(lease.pk, out['skipped_leases'])


class IssueInvoicesAPITests(DRFTestCase):
    base = '/api/v1/invoices/issue/'

    def test_issue_requires_org_admin(self):
        lease = create_lease(start_date=date(2025, 1, 1))
        org = lease.unit.building.org
        user = create_user(suffix=f'm{org.pk}')
        create_user_role(user=user, org=org, role='read_only')
        self.client.force_authenticate(user=user)
        self.client.credentials(HTTP_X_ORG_ID=str(org.pk))
        r = self.client.post(self.base, {}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_issue_ok_for_admin(self):
        lease = create_lease(
            start_date=date(2025, 1, 1),
            billing_cycle='monthly',
            rent_amount=Decimal('200.00'),
        )
        org = lease.unit.building.org
        auth_client_for_org(self.client, org)
        r = self.client.post(self.base, {'dry_run': True}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.content)
        data = r.json()
        self.assertTrue(data['dry_run'])
        self.assertGreaterEqual(data['would_create_count'], 1)
