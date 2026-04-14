from datetime import date

from rest_framework import status

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

    def test_active_lease_syncs_unit_occupied(self):
        unit = create_unit()
        org = unit.building.org
        auth_client_for_org(self.client, org)
        tenant = create_tenant(org=org)
        staff = create_user(username='occ_u1', email='occ1@example.com')
        self.assert_create(
            self.base,
            {
                'unit': unit.pk,
                'tenant': tenant.pk,
                'managed_by': staff.pk,
                'start_date': str(date(2025, 4, 1)),
                'rent_amount': '900.00',
                'billing_cycle': 'monthly',
                'status': 'active',
            },
        )
        unit.refresh_from_db()
        self.assertEqual(unit.status, 'occupied')

    def test_terminate_syncs_unit_vacant(self):
        unit = create_unit()
        org = unit.building.org
        auth_client_for_org(self.client, org)
        tenant = create_tenant(org=org)
        staff = create_user(username='vac_u1', email='vac1@example.com')
        created = self.assert_create(
            self.base,
            {
                'unit': unit.pk,
                'tenant': tenant.pk,
                'managed_by': staff.pk,
                'start_date': str(date(2025, 4, 1)),
                'rent_amount': '900.00',
                'billing_cycle': 'monthly',
                'status': 'active',
            },
        )
        unit.refresh_from_db()
        self.assertEqual(unit.status, 'occupied')
        self.assert_patch_ok(f'{self.base}{created["id"]}/', {'status': 'terminated'})
        unit.refresh_from_db()
        self.assertEqual(unit.status, 'vacant')

    def test_reject_active_lease_on_maintenance_unit(self):
        unit = create_unit(status='maintenance')
        org = unit.building.org
        auth_client_for_org(self.client, org)
        tenant = create_tenant(org=org)
        staff = create_user(username='mnt_u1', email='mnt1@example.com')
        r = self.client.post(
            self.base,
            {
                'unit': unit.pk,
                'tenant': tenant.pk,
                'managed_by': staff.pk,
                'start_date': str(date(2025, 4, 1)),
                'rent_amount': '900.00',
                'billing_cycle': 'monthly',
                'status': 'active',
            },
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST, r.content)

    def test_reject_second_active_lease_same_unit(self):
        unit = create_unit()
        org = unit.building.org
        auth_client_for_org(self.client, org)
        t1 = create_tenant(org=org, name='T1')
        t2 = create_tenant(org=org, name='T2')
        staff = create_user(username='dup_u1', email='dup1@example.com')
        self.assert_create(
            self.base,
            {
                'unit': unit.pk,
                'tenant': t1.pk,
                'managed_by': staff.pk,
                'start_date': str(date(2025, 4, 1)),
                'rent_amount': '900.00',
                'billing_cycle': 'monthly',
                'status': 'active',
            },
        )
        r = self.client.post(
            self.base,
            {
                'unit': unit.pk,
                'tenant': t2.pk,
                'managed_by': staff.pk,
                'start_date': str(date(2025, 5, 1)),
                'rent_amount': '950.00',
                'billing_cycle': 'monthly',
                'status': 'active',
            },
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST, r.content)
