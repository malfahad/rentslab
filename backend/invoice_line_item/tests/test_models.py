from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase

from invoice_line_item.models import InvoiceLineItem
from test_helpers import create_invoice_line_item, create_job_order


class InvoiceLineItemModelTests(TestCase):
    def test_line_item_on_invoice(self):
        line = create_invoice_line_item(description='Rent', amount=Decimal('500.00'))
        self.assertEqual(line.line_number, 1)

    def test_job_recharge_requires_job_order(self):
        line = create_invoice_line_item(description='Recharge', amount=Decimal('10.00'))
        line.line_kind = InvoiceLineItem.LINE_KIND_JOB_RECHARGE
        with self.assertRaises(ValidationError):
            line.full_clean()

    def test_job_recharge_with_job_order_ok(self):
        jo = create_job_order(job_number='WO-IR-1')
        line = create_invoice_line_item(description='Recharge', amount=Decimal('10.00'))
        line.line_kind = InvoiceLineItem.LINE_KIND_JOB_RECHARGE
        line.job_order = jo
        line.full_clean()
