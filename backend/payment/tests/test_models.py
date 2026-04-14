from django.test import TestCase

from test_helpers import create_lease, create_payment


class PaymentModelTests(TestCase):
    def test_payment_optional_lease(self):
        p = create_payment(lease=None)
        self.assertIsNone(p.lease_id)

    def test_payment_with_lease(self):
        lease = create_lease()
        p = create_payment(org=lease.unit.building.org, tenant=lease.tenant, lease=lease)
        self.assertEqual(p.lease_id, lease.pk)
