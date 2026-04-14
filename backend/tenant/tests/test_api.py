from test_helpers import auth_client_for_org, create_org
from testing_common import DRFTestCase


class TenantAPITests(DRFTestCase):
    base = '/api/v1/tenants/'

    def test_crud(self):
        org = create_org()
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {'org': org.pk, 'name': 'Tenant API', 'tenant_type': 'individual'},
        )
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'name': 'Tenant API 2'})
