from decimal import Decimal

from django.test import TestCase

from test_helpers import create_lease, create_service, create_service_subscription


class ServiceSubscriptionModelTests(TestCase):
    def test_subscription_links_lease_and_service(self):
        lease = create_lease()
        svc = create_service(org=lease.unit.building.org)
        sub = create_service_subscription(lease=lease, service=svc, rate=Decimal('25.00'))
        self.assertEqual(sub.lease_id, lease.pk)
