"""End-to-end graph using shared factories."""

from django.test import TestCase

from test_helpers import build_full_graph


class FullGraphIntegrationTests(TestCase):
    def test_build_full_graph(self):
        g = build_full_graph()
        self.assertEqual(g['invoice'].lease_id, g['lease'].pk)
        self.assertEqual(g['allocation'].invoice_id, g['invoice'].pk)
        self.assertEqual(g['allocation'].payment_id, g['payment'].pk)
        self.assertEqual(g['credit_note'].invoice_id, g['invoice'].pk)
        self.assertEqual(g['tenant'].org_id, g['org'].pk)
