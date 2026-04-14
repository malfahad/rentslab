from test_helpers import auth_client_for_org, create_lease, create_service
from testing_common import DRFTestCase


class ServiceSubscriptionAPITests(DRFTestCase):
    base = '/api/v1/service-subscriptions/'

    def test_crud(self):
        lease = create_lease()
        org = lease.unit.building.org
        auth_client_for_org(self.client, org)
        svc = create_service(org=org)
        created = self.assert_create(
            self.base,
            {'lease': lease.pk, 'service': svc.pk, 'rate': '40.00', 'billing_cycle': 'monthly'},
        )
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'rate': '45.00'})

    def test_subscription_defaults_currency_from_service(self):
        lease = create_lease()
        org = lease.unit.building.org
        auth_client_for_org(self.client, org)
        svc = create_service(org=org, currency='KES')
        created = self.assert_create(
            self.base,
            {'lease': lease.pk, 'service': svc.pk, 'rate': '40.00', 'billing_cycle': 'monthly'},
        )
        self.assertEqual(created.get('currency'), 'KES')
