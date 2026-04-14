from test_helpers import auth_client_for_org, create_lease
from testing_common import DRFTestCase


class PaymentAPITests(DRFTestCase):
    base = '/api/v1/payments/'

    def test_crud(self):
        lease = create_lease()
        org = lease.unit.building.org
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {
                'org': org.pk,
                'tenant': lease.tenant.pk,
                'lease': lease.pk,
                'amount': '300.00',
                'method': 'mobile_money',
                'reference': 'TX-1',
                'payment_date': '2025-09-01T10:00:00Z',
            },
        )
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'reference': 'TX-2'})
