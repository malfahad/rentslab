from django.core.exceptions import ValidationError
from django.test import TestCase

from test_helpers import (
    create_building,
    create_expense,
    create_expense_category,
    create_job_order,
    create_org,
    create_unit,
    create_vendor,
)


class ExpenseModelTests(TestCase):
    def test_category_must_match_org(self):
        org = create_org()
        other = create_org()
        cat = create_expense_category(org=other)
        exp = create_expense(org=org, expense_category=cat)
        with self.assertRaises(ValidationError):
            exp.full_clean()

    def test_job_order_building_matches_expense_building(self):
        org = create_org()
        b1 = create_building(org=org)
        b2 = create_building(org=org)
        jo = create_job_order(org=org, building=b1, job_number='WO-300')
        cat = create_expense_category(org=org)
        exp = create_expense(org=org, expense_category=cat, building=b2, job_order=jo)
        with self.assertRaises(ValidationError):
            exp.full_clean()
