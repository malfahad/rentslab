from test_helpers import auth_client_for_org, create_invoice
from testing_common import DRFTestCase


class InvoiceLineItemAPITests(DRFTestCase):
    base = '/api/v1/invoice-line-items/'

    def test_crud(self):
        inv = create_invoice()
        auth_client_for_org(self.client, inv.org)
        created = self.assert_create(
            self.base,
            {
                'invoice': inv.pk,
                'line_number': 1,
                'description': 'Line API',
                'amount': '100.00',
            },
        )
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'description': 'Line API updated'})
