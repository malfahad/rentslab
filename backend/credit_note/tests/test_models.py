from datetime import date
from decimal import Decimal

from django.test import TestCase

from test_helpers import create_credit_note


class CreditNoteModelTests(TestCase):
    def test_credit_note_on_invoice(self):
        cn = create_credit_note(amount=Decimal('10.00'), credit_date=date(2025, 7, 1))
        self.assertEqual(cn.invoice.pk, cn.invoice_id)
