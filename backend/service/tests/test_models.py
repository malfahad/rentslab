from django.test import TestCase

from test_helpers import create_service


class ServiceModelTests(TestCase):
    def test_service_per_org(self):
        s = create_service(name='Internet')
        self.assertTrue(s.is_active)
