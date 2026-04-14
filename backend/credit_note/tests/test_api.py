from datetime import date

from test_helpers import auth_client_for_org, create_invoice
from testing_common import DRFTestCase


class CreditNoteAPITests(DRFTestCase):
    base = '/api/v1/credit-notes/'

    def test_crud(self):
        inv = create_invoice()
        auth_client_for_org(self.client, inv.org)
        created = self.assert_create(
            self.base,
            {
                'invoice': inv.pk,
                'amount': '25.00',
                'reason': 'Goodwill',
                'credit_date': str(date(2025, 8, 1)),
            },
        )
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'reason': 'Goodwill updated'})
