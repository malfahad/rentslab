from vendor.models import Vendor
from test_helpers import auth_client_for_org, create_org
from testing_common import DRFTestCase


class VendorAPITests(DRFTestCase):
    base = '/api/v1/vendors/'

    def test_crud(self):
        org = create_org()
        auth_client_for_org(self.client, org)
        created = self.assert_create(self.base, {'org': org.pk, 'name': 'Vendor API'})
        pk = created['id']
        self.assert_retrieve_ok(f'{self.base}{pk}/')
        self.assert_patch_ok(f'{self.base}{pk}/', {'name': 'Vendor Updated'})
        self.assert_delete_ok(f'{self.base}{pk}/')
        self.assertFalse(Vendor.objects.filter(pk=pk).exists())
