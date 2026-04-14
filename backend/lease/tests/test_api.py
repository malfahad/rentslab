from datetime import date

from test_helpers import auth_client_for_org, create_tenant, create_unit, create_user
from testing_common import DRFTestCase


class LeaseAPITests(DRFTestCase):
    base = '/api/v1/leases/'

    def test_crud(self):
        unit = create_unit()
        org = unit.building.org
        auth_client_for_org(self.client, org)
        tenant = create_tenant(org=org)
        staff = create_user(username='lease_mgr', email='lm@example.com')
        payload = {
            'unit': unit.pk,
            'tenant': tenant.pk,
            'managed_by': staff.pk,
            'start_date': str(date(2025, 4, 1)),
            'end_date': None,
            'rent_amount': '1200.00',
            'deposit_amount': '1200.00',
            'billing_cycle': 'monthly',
            'status': 'active',
        }
        created = self.assert_create(self.base, payload)
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'status': 'terminated'})
