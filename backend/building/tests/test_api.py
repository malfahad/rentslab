from test_helpers import auth_client_for_org, create_landlord, create_org
from testing_common import DRFTestCase


class BuildingAPITests(DRFTestCase):
    base = '/api/v1/buildings/'

    def test_crud(self):
        org = create_org()
        auth_client_for_org(self.client, org)
        ll = create_landlord(org=org)
        created = self.assert_create(
            self.base,
            {'org': org.pk, 'landlord': ll.pk, 'name': 'Tower A', 'building_type': 'residential'},
        )
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'name': 'Tower A+'})
