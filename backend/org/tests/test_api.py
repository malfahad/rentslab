from org.models import Org
from test_helpers import create_user
from testing_common import DRFTestCase


class OrgAPITests(DRFTestCase):
    base = '/api/v1/orgs/'

    def test_creates_list_retrieves_updates(self):
        user = create_user(suffix='orgapi')
        self.client.force_authenticate(user=user)
        self.assert_list_ok(self.base)
        created = self.assert_create(
            self.base,
            {'name': 'API Org', 'org_type': 'property_manager'},
        )
        pk = created['id']
        self.assert_retrieve_ok(f'{self.base}{pk}/')
        self.assert_patch_ok(f'{self.base}{pk}/', {'name': 'API Org Renamed'})
        # DELETE /orgs/:id/ is not supported while RoleDefinitions reference the org (protected FK).
        self.assertTrue(Org.objects.filter(pk=pk).exists())
