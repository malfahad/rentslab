from django.db import IntegrityError
from django.test import TestCase

from test_helpers import create_expense_category, create_org


class ExpenseCategoryModelTests(TestCase):
    def test_unique_name_per_org(self):
        org = create_org()
        create_expense_category(org=org, name='Utilities')
        with self.assertRaises(IntegrityError):
            create_expense_category(org=org, name='Utilities')
