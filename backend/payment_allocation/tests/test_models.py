from django.test import TestCase

from test_helpers import build_full_graph


class PaymentAllocationModelTests(TestCase):
    def test_allocation_links_payment_and_invoice(self):
        g = build_full_graph()
        alloc = g['allocation']
        self.assertEqual(alloc.payment.org_id, alloc.invoice.org_id)
        self.assertEqual(alloc.invoice.lease_id, g['lease'].pk)
