from expense_category.models import ExpenseCategory
from test_helpers import auth_client_for_org, create_org
from testing_common import DRFTestCase


class ExpenseCategoryAPITests(DRFTestCase):
    base = '/api/v1/expense-categories/'

    def test_crud(self):
        org = create_org()
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {'org': org.pk, 'name': 'Repairs', 'is_active': True},
        )
        pk = created['id']
        self.assert_retrieve_ok(f'{self.base}{pk}/')
        self.assert_patch_ok(f'{self.base}{pk}/', {'name': 'Repairs Updated'})
        self.assert_delete_ok(f'{self.base}{pk}/')
        self.assertFalse(ExpenseCategory.objects.filter(pk=pk).exists())
