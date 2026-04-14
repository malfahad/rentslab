from job_order.models import JobOrder
from test_helpers import auth_client_for_org, create_building, create_org, create_vendor
from testing_common import DRFTestCase


class JobOrderAPITests(DRFTestCase):
    base = '/api/v1/job-orders/'

    def test_crud(self):
        org = create_org()
        building = create_building(org=org)
        vendor = create_vendor(org=org)
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {
                'org': org.pk,
                'job_number': 'JO-1',
                'building': building.pk,
                'vendor': vendor.pk,
                'title': 'Repair roof',
                'status': 'open',
            },
        )
        pk = created['id']
        self.assert_retrieve_ok(f'{self.base}{pk}/')
        self.assert_patch_ok(f'{self.base}{pk}/', {'status': 'in_progress'})
        self.assert_delete_ok(f'{self.base}{pk}/')
        self.assertFalse(JobOrder.objects.filter(pk=pk).exists())
