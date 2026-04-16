from datetime import date
from decimal import Decimal

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

    def test_credit_amount_cannot_exceed_remaining(self):
        inv = create_invoice(total_amount=Decimal('100.00'))
        auth_client_for_org(self.client, inv.org)
        r = self.client.post(
            self.base,
            {
                'invoice': inv.pk,
                'amount': '150.00',
                'reason': 'Too much',
                'credit_date': str(date(2025, 8, 1)),
            },
            format='json',
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn('amount', r.data)
