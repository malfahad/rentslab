from test_helpers import auth_client_for_org, create_unit
from testing_common import DRFTestCase


class UnitAPITests(DRFTestCase):
    base = '/api/v1/units/'

    def test_crud(self):
        u = create_unit(unit_number='api-u')
        auth_client_for_org(self.client, u.building.org)
        created = self.assert_create(
            self.base,
            {
                'building': u.building.pk,
                'unit_number': 'api-u-2',
                'unit_type': 'apartment',
                'status': 'vacant',
            },
        )
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'status': 'maintenance'})
