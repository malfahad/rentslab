from django.db import IntegrityError
from django.test import TestCase

from test_helpers import create_unit


class UnitModelTests(TestCase):
    def test_unique_unit_number_per_building(self):
        u = create_unit(unit_number='X1')
        with self.assertRaises(IntegrityError):
            create_unit(building=u.building, unit_number='X1')
