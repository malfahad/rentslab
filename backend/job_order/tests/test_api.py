from decimal import Decimal

from rest_framework import status

from job_order.models import JobOrder
from test_helpers import (
    auth_client_for_org,
    create_building,
    create_expense_category,
    create_invoice,
    create_lease,
    create_org,
    create_unit,
    create_vendor,
)
from testing_common import DRFTestCase


class JobOrderAPITests(DRFTestCase):
    base = '/api/v1/job-orders/'

    def test_crud(self):
        org = create_org()
        building = create_building(org=org)
        vendor = create_vendor(org=org)
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {
                'org': org.pk,
                'job_number': 'JO-1',
                'building': building.pk,
                'vendor': vendor.pk,
                'title': 'Repair roof',
                'status': 'open',
            },
        )
        pk = created['id']
        self.assert_retrieve_ok(f'{self.base}{pk}/')
        self.assert_patch_ok(f'{self.base}{pk}/', {'status': 'in_progress'})
        self.assert_delete_ok(f'{self.base}{pk}/')
        self.assertFalse(JobOrder.objects.filter(pk=pk).exists())

    def test_create_auto_job_number_and_default_status(self):
        org = create_org()
        building = create_building(org=org)
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {
                'org': org.pk,
                'building': building.pk,
                'title': 'Unnumbered job',
            },
        )
        self.assertTrue(created['job_number'].startswith(f'JO-{org.pk}-'))
        self.assertEqual(created['status'], 'draft')

    def test_invalid_status_transition(self):
        org = create_org()
        building = create_building(org=org)
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {
                'org': org.pk,
                'building': building.pk,
                'title': 'T',
                'status': 'draft',
            },
        )
        pk = created['id']
        r = self.client.patch(f'{self.base}{pk}/', {'status': 'in_progress'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST, r.content)

    def test_recharge_adds_line_and_syncs_invoice_total(self):
        org = create_org()
        building = create_building(org=org)
        unit = create_unit(building=building)
        auth_client_for_org(self.client, org)
        jo = self.assert_create(
            self.base,
            {
                'org': org.pk,
                'building': building.pk,
                'unit': unit.pk,
                'title': 'Repair',
                'status': 'open',
            },
        )
        lease = create_lease(unit=unit, tenant__org=org)
        inv = create_invoice(lease=lease, org=org, total_amount=Decimal('0.00'))

        r = self.client.post(
            f'{self.base}{jo["id"]}/recharge/',
            {
                'invoice': inv.pk,
                'amount': '150.00',
                'description': 'Tenant share of repair',
            },
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.content)
        data = r.json()
        self.assertEqual(data['line_kind'], 'job_recharge')
        self.assertEqual(data['job_order'], jo['id'])
        inv.refresh_from_db()
        self.assertEqual(inv.total_amount, Decimal('150.00'))


class JobOrderExpenseRollupTests(DRFTestCase):
    base = '/api/v1/job-orders/'
    exp_base = '/api/v1/expenses/'

    def test_actual_cost_updates_from_approved_expenses(self):
        org = create_org()
        building = create_building(org=org)
        cat = create_expense_category(org=org)
        auth_client_for_org(self.client, org)
        jo = self.assert_create(
            self.base,
            {
                'org': org.pk,
                'building': building.pk,
                'title': 'Work',
                'status': 'open',
            },
        )
        self.assert_create(
            self.exp_base,
            {
                'org': org.pk,
                'expense_category': cat.pk,
                'expense_date': '2025-05-01',
                'amount': '40.00',
                'description': 'Supplies',
                'status': 'approved',
                'building': building.pk,
                'job_order': jo['id'],
            },
        )
        out = self.assert_retrieve_ok(f'{self.base}{jo["id"]}/')
        self.assertEqual(out['actual_cost'], '40.00')
