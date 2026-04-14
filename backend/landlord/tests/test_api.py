from landlord.models import Landlord
from test_helpers import auth_client_for_org, create_org
from testing_common import DRFTestCase


class LandlordAPITests(DRFTestCase):
    base = '/api/v1/landlords/'

    def test_crud(self):
        org = create_org()
        auth_client_for_org(self.client, org)
        created = self.assert_create(self.base, {'org': org.pk, 'name': 'LL API'})
        pk = created['id']
        self.assert_retrieve_ok(f'{self.base}{pk}/')
        self.assert_patch_ok(f'{self.base}{pk}/', {'name': 'LL Updated'})
        self.assert_delete_ok(f'{self.base}{pk}/')
        self.assertFalse(Landlord.objects.filter(pk=pk).exists())
