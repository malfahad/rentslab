from django.db import IntegrityError
from django.test import TestCase

from test_helpers import create_org, create_user, create_user_role


class UserRoleModelTests(TestCase):
    def test_unique_user_per_org(self):
        org = create_org()
        user = create_user(username='role_dup', email='rd@example.com')
        create_user_role(user=user, org=org, role='agent')
        with self.assertRaises(IntegrityError):
            create_user_role(user=user, org=org, role='read_only')

    def test_same_user_different_orgs(self):
        o1 = create_org(name='O1')
        o2 = create_org(name='O2')
        user = create_user(username='multi_org', email='mo@example.com')
        create_user_role(user=user, org=o1, role='agent')
        create_user_role(user=user, org=o2, role='agent')
        self.assertEqual(user.user_roles.count(), 2)
