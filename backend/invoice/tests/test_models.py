from datetime import date
from decimal import Decimal

from django.test import TestCase

from test_helpers import create_invoice


class InvoiceModelTests(TestCase):
    def test_invoice_on_lease(self):
        inv = create_invoice(issue_date=date(2025, 5, 1), total_amount=Decimal('900.00'))
        self.assertEqual(inv.status, 'unpaid')
