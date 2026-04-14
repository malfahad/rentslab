from datetime import date
from decimal import Decimal

from rest_framework import status

from expense.models import Expense
from test_helpers import auth_client_for_org, create_building, create_expense_category, create_org
from testing_common import DRFTestCase


class ExpenseAPITests(DRFTestCase):
    base = '/api/v1/expenses/'

    def test_crud(self):
        org = create_org()
        cat = create_expense_category(org=org, name='Ops')
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {
                'org': org.pk,
                'expense_category': cat.pk,
                'expense_date': '2025-04-01',
                'amount': '250.00',
                'description': 'Paint',
                'status': 'draft',
            },
        )
        pk = created['id']
        self.assert_retrieve_ok(f'{self.base}{pk}/')
        self.assert_patch_ok(f'{self.base}{pk}/', {'status': 'approved'})
        self.assert_delete_ok(f'{self.base}{pk}/')
        self.assertFalse(Expense.objects.filter(pk=pk).exists())

    def test_rejects_category_from_other_org(self):
        org = create_org()
        other = create_org()
        cat = create_expense_category(org=other, name='Alien')
        auth_client_for_org(self.client, org)
        r = self.client.post(
            self.base,
            {
                'org': org.pk,
                'expense_category': cat.pk,
                'expense_date': date(2025, 4, 1).isoformat(),
                'amount': '10.00',
                'description': 'Bad',
                'status': 'draft',
            },
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST, r.content)

    def test_rejects_zero_amount(self):
        org = create_org()
        cat = create_expense_category(org=org)
        auth_client_for_org(self.client, org)
        r = self.client.post(
            self.base,
            {
                'org': org.pk,
                'expense_category': cat.pk,
                'expense_date': '2025-04-01',
                'amount': '0',
                'description': 'Zero',
                'status': 'draft',
            },
            format='json',
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST, r.content)

    def test_expense_with_building_and_job_order(self):
        org = create_org()
        building = create_building(org=org)
        cat = create_expense_category(org=org)
        auth_client_for_org(self.client, org)
        jo = self.assert_create(
            '/api/v1/job-orders/',
            {
                'org': org.pk,
                'job_number': 'JO-EXP-1',
                'building': building.pk,
                'title': 'Work',
                'status': 'open',
            },
        )
        exp = self.assert_create(
            self.base,
            {
                'org': org.pk,
                'expense_category': cat.pk,
                'expense_date': '2025-04-02',
                'amount': '99.50',
                'description': 'Parts',
                'status': 'paid',
                'building': building.pk,
                'job_order': jo['id'],
            },
        )
        self.assertEqual(exp['amount'], '99.50')
