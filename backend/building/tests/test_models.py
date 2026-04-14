from django.test import TestCase

from test_helpers import create_building


class BuildingModelTests(TestCase):
    def test_building_links_org_and_landlord(self):
        b = create_building()
        self.assertEqual(b.org_id, b.landlord.org_id)
