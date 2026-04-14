from test_helpers import auth_client_for_org, create_invoice, create_lease, create_payment
from testing_common import DRFTestCase


class PaymentAllocationAPITests(DRFTestCase):
    base = '/api/v1/payment-allocations/'

    def test_crud(self):
        lease = create_lease()
        org = lease.unit.building.org
        auth_client_for_org(self.client, org)
        pay = create_payment(org=org, tenant=lease.tenant, lease=lease)
        inv = create_invoice(lease=lease, org=org)
        created = self.assert_create(
            self.base,
            {'payment': pay.pk, 'invoice': inv.pk, 'amount_applied': '250.00'},
        )
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'amount_applied': '200.00'})
