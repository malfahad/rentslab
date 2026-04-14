from django.test import TestCase

from test_helpers import create_tenant


class TenantModelTests(TestCase):
    def test_tenant_scoped_to_org(self):
        t = create_tenant(name='Jane')
        self.assertIsNotNone(t.org_id)
