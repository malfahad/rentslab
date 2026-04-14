from datetime import date

from test_helpers import auth_client_for_org, create_lease
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
