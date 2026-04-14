from django.test import TestCase

from org.models import Org


class OrgModelTests(TestCase):
    def test_create_org(self):
        o = Org.objects.create(name='Acme PM', org_type='property_manager')
        self.assertEqual(o.name, 'Acme PM')
