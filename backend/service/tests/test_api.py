from test_helpers import auth_client_for_org, create_org
from testing_common import DRFTestCase


class ServiceAPITests(DRFTestCase):
    base = '/api/v1/services/'

    def test_crud(self):
        org = create_org()
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {'org': org.pk, 'name': 'Water', 'billing_type': 'fixed', 'is_active': True},
        )
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'is_active': False})
