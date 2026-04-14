from django.test import TestCase

from test_helpers import create_landlord, create_org


class LandlordModelTests(TestCase):
    def test_landlord_belongs_to_org(self):
        org = create_org()
        ll = create_landlord(org=org, name='Owner Co')
        self.assertEqual(ll.org_id, org.pk)
