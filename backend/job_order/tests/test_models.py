from django.core.exceptions import ValidationError
from django.test import TestCase

from test_helpers import create_building, create_job_order, create_org, create_unit, create_vendor


class JobOrderModelTests(TestCase):
    def test_unit_must_match_building(self):
        org = create_org()
        b1 = create_building(org=org)
        b2 = create_building(org=org)
        u = create_unit(building=b2, unit_number='X1')
        job = create_job_order(org=org, building=b1, unit=u, job_number='WO-100')
        with self.assertRaises(ValidationError):
            job.full_clean()

    def test_vendor_must_match_org(self):
        org = create_org()
        other = create_org()
        b = create_building(org=org)
        v = create_vendor(org=other)
        job = create_job_order(org=org, building=b, vendor=v, job_number='WO-200')
        with self.assertRaises(ValidationError):
            job.full_clean()
