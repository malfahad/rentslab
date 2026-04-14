from decimal import Decimal

from django.test import TestCase

from test_helpers import create_invoice_line_item


class InvoiceLineItemModelTests(TestCase):
    def test_line_item_on_invoice(self):
        line = create_invoice_line_item(description='Rent', amount=Decimal('500.00'))
        self.assertEqual(line.line_number, 1)
