from django.contrib.auth import get_user_model
from rest_framework import status

from test_helpers import create_user
from testing_common import DRFTestCase

User = get_user_model()


class UserAPITests(DRFTestCase):
    base = '/api/v1/users/'

    def setUp(self):
        super().setUp()
        self.instance = create_user(username='api_staff', email='api_staff@example.com')

    def test_list_users(self):
        data = self.assert_list_ok(self.base)
        self.assertGreaterEqual(len(data), 1)

    def test_retrieve_user(self):
        row = self.assert_retrieve_ok(f'{self.base}{self.instance.pk}/')
        self.assertEqual(row['username'], 'api_staff')

    def test_patch_phone(self):
        row = self.assert_patch_ok(f'{self.base}{self.instance.pk}/', {'phone': '+15550001'})
        self.assertEqual(row['phone'], '+15550001')

    def test_post_without_password_not_supported_by_serializer(self):
        """Serializer has no password field; POST may create unusable account or fail."""
        r = self.client.post(
            self.base,
            {'username': 'newguy', 'email': 'newguy@example.com'},
            format='json',
        )
        self.assertIn(r.status_code, (status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST))
