from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()


class UserModelTests(TestCase):
    def test_create_user_with_password(self):
        u = User.objects.create_user(
            username='model_user',
            email='model_user@example.com',
            password='secret123',
        )
        self.assertIsNotNone(u.pk)
        self.assertTrue(u.check_password('secret123'))

    def test_user_phone_field(self):
        u = User.objects.create_user(
            username='phone_user',
            email='p@example.com',
            password='x',
            phone='+1000000000',
        )
        u.refresh_from_db()
        self.assertEqual(u.phone, '+1000000000')
