from django.contrib.auth.tokens import default_token_generator
from django.test import TestCase
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from org.models import Org
from rest_framework import status
from rest_framework.test import APIClient
from user_role.models import UserRole

from users.models import User
from users.tests.utils import assert_error_response, assert_success_detail
from users.tokens import account_activation_token


def _uid(user: User) -> str:
    raw = urlsafe_base64_encode(force_bytes(user.pk))
    return raw.decode() if isinstance(raw, bytes) else raw


class AuthFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_creates_org_via_signal(self):
        self.assertEqual(Org.objects.count(), 0)
        r = self.client.post(
            '/api/v1/auth/register/',
            {
                'email': 'newowner@example.com',
                'password': 'securepass1',
                'org_name': 'Acme PM',
            },
            format='json',
        )
        assert_success_detail(self, r, status.HTTP_201_CREATED, 'Registration successful')
        user = User.objects.get(email='newowner@example.com')
        self.assertFalse(user.is_active)
        self.assertEqual(Org.objects.count(), 1)
        self.assertEqual(Org.objects.first().name, 'Acme PM')
        self.assertTrue(UserRole.objects.filter(user=user, role_definition__key='admin').exists())

    def test_activate_then_login(self):
        self.client.post(
            '/api/v1/auth/register/',
            {'email': 'act2@example.com', 'password': 'securepass1'},
            format='json',
        )
        u = User.objects.get(email='act2@example.com')
        self.assertFalse(u.is_active)
        ar = self.client.post(
            '/api/v1/auth/activate-account/',
            {'uid': _uid(u), 'token': account_activation_token.make_token(u)},
            format='json',
        )
        assert_success_detail(self, ar, status.HTTP_200_OK, 'Account activated')
        u.refresh_from_db()
        self.assertTrue(u.is_active)

        lr = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'act2@example.com', 'password': 'securepass1'},
            format='json',
        )
        self.assertEqual(lr.status_code, status.HTTP_200_OK)
        body = lr.json()
        self.assertIn('access', body)
        self.assertIn('refresh', body)
        self.assertIn('user', body)
        self.assertEqual(body['user']['email'], 'act2@example.com')

    def test_reset_password(self):
        self.client.post(
            '/api/v1/auth/register/',
            {'email': 'rp@example.com', 'password': 'oldpass12'},
            format='json',
        )
        u = User.objects.get(email='rp@example.com')
        rr = self.client.post(
            '/api/v1/auth/reset-password/',
            {
                'uid': _uid(u),
                'token': default_token_generator.make_token(u),
                'new_password': 'newpass123',
            },
            format='json',
        )
        assert_success_detail(self, rr, status.HTTP_200_OK, 'Password has been reset')
        u.refresh_from_db()
        self.assertTrue(u.check_password('newpass123'))

    def test_delete_account_requires_password(self):
        self.client.post(
            '/api/v1/auth/register/',
            {'email': 'del@example.com', 'password': 'securepass1'},
            format='json',
        )
        u = User.objects.get(email='del@example.com')
        self.client.post(
            '/api/v1/auth/activate-account/',
            {'uid': _uid(u), 'token': account_activation_token.make_token(u)},
            format='json',
        )
        login = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'del@example.com', 'password': 'securepass1'},
            format='json',
        )
        token = login.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        dr = self.client.post('/api/v1/auth/delete-account/', {'password': 'wrong'}, format='json')
        assert_error_response(
            self,
            dr,
            status.HTTP_400_BAD_REQUEST,
            field_messages={'password': 'incorrect'},
        )
        dr = self.client.post('/api/v1/auth/delete-account/', {'password': 'securepass1'}, format='json')
        assert_success_detail(self, dr, status.HTTP_200_OK, 'Account deleted')
        u.refresh_from_db()
        self.assertTrue(u.deleted_at)


class AuthMisuseTests(TestCase):
    """Negative paths: invalid input, auth failures, token misuse, enumeration safety."""

    def setUp(self):
        self.client = APIClient()

    # --- register ---

    def test_register_rejects_duplicate_email(self):
        self.client.post(
            '/api/v1/auth/register/',
            {'email': 'dup@example.com', 'password': 'securepass1'},
            format='json',
        )
        r = self.client.post(
            '/api/v1/auth/register/',
            {'email': 'dup@example.com', 'password': 'otherpass1'},
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            field_messages={'email': 'already exists'},
        )

    def test_register_rejects_short_password(self):
        r = self.client.post(
            '/api/v1/auth/register/',
            {'email': 'short@example.com', 'password': 'short'},
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            field_messages={'password': 'least 8'},
        )

    def test_register_requires_email_and_password(self):
        r = self.client.post('/api/v1/auth/register/', {'email': 'only@example.com'}, format='json')
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            field_messages={'password': 'required'},
        )
        r = self.client.post('/api/v1/auth/register/', {'password': 'securepass1'}, format='json')
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            field_messages={'email': 'required'},
        )

    def test_register_rejects_invalid_email_format(self):
        r = self.client.post(
            '/api/v1/auth/register/',
            {'email': 'not-an-email', 'password': 'securepass1'},
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            field_messages={'email': 'valid'},
        )

    # --- login ---

    def test_login_rejects_wrong_password(self):
        self.client.post(
            '/api/v1/auth/register/',
            {'email': 'loginbad@example.com', 'password': 'correctpass1'},
            format='json',
        )
        u = User.objects.get(email='loginbad@example.com')
        self.client.post(
            '/api/v1/auth/activate-account/',
            {'uid': _uid(u), 'token': account_activation_token.make_token(u)},
            format='json',
        )
        r = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'loginbad@example.com', 'password': 'wrongpassword1'},
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            detail_substring='Invalid email or password',
        )

    def test_login_rejects_unknown_email(self):
        r = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'nobody@example.com', 'password': 'whateverpass1'},
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            detail_substring='Invalid email or password',
        )

    def test_login_rejects_inactive_user(self):
        self.client.post(
            '/api/v1/auth/register/',
            {'email': 'inactive@example.com', 'password': 'securepass1'},
            format='json',
        )
        r = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'inactive@example.com', 'password': 'securepass1'},
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            detail_substring='not active',
        )

    def test_login_rejects_deleted_user(self):
        """After delete, email is anonymized so the old address yields the same generic error as wrong credentials."""
        self.client.post(
            '/api/v1/auth/register/',
            {'email': 'gone@example.com', 'password': 'securepass1'},
            format='json',
        )
        u = User.objects.get(email='gone@example.com')
        self.client.post(
            '/api/v1/auth/activate-account/',
            {'uid': _uid(u), 'token': account_activation_token.make_token(u)},
            format='json',
        )
        login = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'gone@example.com', 'password': 'securepass1'},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login.json()["access"]}')
        self.client.post('/api/v1/auth/delete-account/', {'password': 'securepass1'}, format='json')
        self.client.credentials()
        r = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'gone@example.com', 'password': 'securepass1'},
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            detail_substring='Invalid email or password',
        )

    # --- activate ---

    def test_activate_rejects_invalid_uid(self):
        r = self.client.post(
            '/api/v1/auth/activate-account/',
            {'uid': 'not-base64!!!', 'token': 'abc'},
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            detail_substring='Invalid uid',
        )

    def test_activate_rejects_unknown_user_pk(self):
        raw = urlsafe_base64_encode(force_bytes(999999999))
        uid = raw.decode() if isinstance(raw, bytes) else raw
        r = self.client.post(
            '/api/v1/auth/activate-account/',
            {'uid': uid, 'token': 'fake'},
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            detail_substring='Invalid or expired token',
        )

    def test_activate_rejects_wrong_token(self):
        self.client.post(
            '/api/v1/auth/register/',
            {'email': 'tok@example.com', 'password': 'securepass1'},
            format='json',
        )
        u = User.objects.get(email='tok@example.com')
        r = self.client.post(
            '/api/v1/auth/activate-account/',
            {'uid': _uid(u), 'token': 'invalid-token'},
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            detail_substring='Invalid or expired token',
        )

    def test_activate_second_time_fails_after_first_success(self):
        self.client.post(
            '/api/v1/auth/register/',
            {'email': 'twice@example.com', 'password': 'securepass1'},
            format='json',
        )
        u = User.objects.get(email='twice@example.com')
        t = account_activation_token.make_token(u)
        first = self.client.post(
            '/api/v1/auth/activate-account/',
            {'uid': _uid(u), 'token': t},
            format='json',
        )
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        second = self.client.post(
            '/api/v1/auth/activate-account/',
            {'uid': _uid(u), 'token': t},
            format='json',
        )
        assert_error_response(
            self,
            second,
            status.HTTP_400_BAD_REQUEST,
            detail_substring='Invalid or expired token',
        )

    # --- reset password ---

    def test_reset_password_rejects_invalid_token(self):
        self.client.post(
            '/api/v1/auth/register/',
            {'email': 'rs@example.com', 'password': 'oldpass12'},
            format='json',
        )
        u = User.objects.get(email='rs@example.com')
        r = self.client.post(
            '/api/v1/auth/reset-password/',
            {'uid': _uid(u), 'token': 'bad', 'new_password': 'newpass123'},
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            detail_substring='Invalid or expired token',
        )

    def test_reset_password_rejects_short_new_password(self):
        self.client.post(
            '/api/v1/auth/register/',
            {'email': 'shortnew@example.com', 'password': 'oldpass12'},
            format='json',
        )
        u = User.objects.get(email='shortnew@example.com')
        r = self.client.post(
            '/api/v1/auth/reset-password/',
            {
                'uid': _uid(u),
                'token': default_token_generator.make_token(u),
                'new_password': 'short',
            },
            format='json',
        )
        assert_error_response(
            self,
            r,
            status.HTTP_400_BAD_REQUEST,
            field_messages={'new_password': 'least 8'},
        )

    # --- forgot password (no enumeration) ---

    def test_forgot_password_returns_200_for_unknown_email(self):
        r = self.client.post(
            '/api/v1/auth/forgot-password/',
            {'email': 'missing@example.com'},
            format='json',
        )
        assert_success_detail(self, r, status.HTTP_200_OK, 'If an account exists')

    # --- JWT-protected routes ---

    def test_me_requires_authentication(self):
        r = self.client.get('/api/v1/auth/me/')
        assert_error_response(
            self,
            r,
            status.HTTP_401_UNAUTHORIZED,
            detail_substring='Authentication credentials were not provided',
        )

    def test_delete_account_requires_authentication(self):
        r = self.client.post('/api/v1/auth/delete-account/', {'password': 'x'}, format='json')
        assert_error_response(
            self,
            r,
            status.HTTP_401_UNAUTHORIZED,
            detail_substring='Authentication credentials were not provided',
        )

    def test_token_refresh_rejects_garbage_token(self):
        r = self.client.post('/api/v1/auth/token/refresh/', {'refresh': 'not-a-jwt'}, format='json')
        self.assertIn(r.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST))
        assert_error_response(
            self,
            r,
            r.status_code,
            detail_substring='token',
        )
