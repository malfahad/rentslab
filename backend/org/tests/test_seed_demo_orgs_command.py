from django.core.management import call_command
from django.test import TestCase

from lease.models import Lease
from org.models import Org
from service.models import Service
from service_subscription.models import ServiceSubscription
from tenant.models import Tenant
from unit.models import Unit
from user_role.models import UserRole


class SeedDemoOrgsCommandTests(TestCase):
    def test_small_config_creates_expected_graph(self):
        call_command("seed_demo_orgs", config="small", replace=True)

        org = Org.objects.get(name="Demo Kampala Small Org")
        self.assertEqual(org.city, "Kampala")
        self.assertEqual(org.country_code, "UG")

        self.assertEqual(Unit.objects.filter(building__org=org).count(), 10)
        self.assertEqual(Tenant.objects.filter(org=org).count(), 10)
        self.assertEqual(Lease.objects.filter(unit__building__org=org).count(), 10)
        self.assertEqual(Service.objects.filter(org=org).count(), 3)
        self.assertEqual(ServiceSubscription.objects.filter(lease__unit__building__org=org).count(), 20)
        self.assertEqual(UserRole.objects.filter(org=org).count(), 3)
