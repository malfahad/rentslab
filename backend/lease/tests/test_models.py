from datetime import date
from decimal import Decimal

from django.test import TestCase

from test_helpers import create_lease, create_tenant, create_unit


class LeaseModelTests(TestCase):
    def test_lease_links_unit_and_tenant(self):
        unit = create_unit()
        tenant = create_tenant(org=unit.building.org)
        lease = create_lease(unit=unit, tenant=tenant, start_date=date(2025, 3, 1))
        self.assertEqual(lease.rent_amount, Decimal('1000.00'))
