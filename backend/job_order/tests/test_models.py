from django.core.exceptions import ValidationError
from django.test import TestCase

from job_order.constants import JobOrderStatus
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

    def test_inactive_vendor_rejected(self):
        org = create_org()
        b = create_building(org=org)
        v = create_vendor(org=org, is_active=False)
        job = create_job_order(org=org, building=b, vendor=v, job_number='WO-201', status=JobOrderStatus.OPEN)
        with self.assertRaises(ValidationError):
            job.full_clean()

    def test_status_transition_enforced(self):
        org = create_org()
        b = create_building(org=org)
        job = create_job_order(org=org, building=b, job_number='WO-202', status=JobOrderStatus.DRAFT)
        job.status = JobOrderStatus.IN_PROGRESS
        with self.assertRaises(ValidationError):
            job.full_clean()
