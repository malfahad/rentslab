from datetime import date
from decimal import Decimal

from test_helpers import (
    auth_client_for_org,
    create_invoice,
    create_lease,
    create_payment,
    create_payment_allocation,
)
from testing_common import DRFTestCase


class InvoiceAPITests(DRFTestCase):
    base = '/api/v1/invoices/'

    def test_crud(self):
        lease = create_lease()
        org = lease.unit.building.org
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {
                'lease': lease.pk,
                'org': org.pk,
                'invoice_number': 'INV-100',
                'issue_date': str(date(2025, 6, 1)),
                'due_date': str(date(2025, 6, 15)),
                'total_amount': '1000.00',
                'status': 'unpaid',
            },
        )
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'status': 'paid'})

    def test_outstanding_amount_exposed(self):
        inv = create_invoice(total_amount=Decimal('1000.00'))
        pay = create_payment(
            org=inv.org,
            tenant=inv.lease.tenant,
            lease=inv.lease,
            amount=Decimal('400.00'),
        )
        create_payment_allocation(
            payment=pay,
            invoice=inv,
            amount_applied=Decimal('400.00'),
        )
        auth_client_for_org(self.client, inv.org)
        got = self.assert_retrieve_ok(f'{self.base}{inv.pk}/')
        self.assertEqual(got['outstanding_amount'], '600.00')
