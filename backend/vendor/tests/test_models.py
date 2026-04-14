from django.test import TestCase

from test_helpers import create_org, create_vendor


class VendorModelTests(TestCase):
    def test_vendor_belongs_to_org(self):
        org = create_org()
        v = create_vendor(org=org, name='Acme Plumbing')
        self.assertEqual(v.org_id, org.pk)
