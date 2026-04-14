"""Tokens for account activation (inactive users) and password reset."""

from django.contrib.auth.tokens import PasswordResetTokenGenerator


class AccountActivationTokenGenerator(PasswordResetTokenGenerator):
    """Hash includes `is_active` so tokens invalidate after activation."""

    def _make_hash_value(self, user, timestamp):
        return f'{user.pk}{timestamp}{user.is_active}{user.password}'


account_activation_token = AccountActivationTokenGenerator()
