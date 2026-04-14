from app_services.emailer import (
    send_activate_account_email,
    send_password_changed_email,
    send_password_reset_email,
)
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .auth_serializers import (
    ActivateAccountSerializer,
    DeleteAccountSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
)
from org.models import Org

from .models import User
from .serializers import UserSerializer
from .tokens import account_activation_token


def _uidb64(user: User) -> str:
    return urlsafe_base64_encode(force_bytes(user.pk))


def _decode_uid(uidb64: str) -> int | None:
    try:
        return int(force_str(urlsafe_base64_decode(uidb64)))
    except (ValueError, TypeError, OverflowError):
        return None


def _send_activation_email(user: User) -> None:
    uid = _uidb64(user)
    token = account_activation_token.make_token(user)
    send_activate_account_email(user.email, uid=uid, token=token)


def _send_password_reset_email(user: User) -> None:
    uid = _uidb64(user)
    token = default_token_generator.make_token(user)
    send_password_reset_email(user.email, uid=uid, token=token)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _send_activation_email(user)
        payload = {
            'detail': 'Registration successful. Check your email to activate your account.',
            'user_id': user.pk,
        }
        if settings.DEBUG:
            payload['debug_activation'] = {
                'uid': _uidb64(user),
                'token': account_activation_token.make_token(user),
            }
        return Response(payload, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data,
            }
        )


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].lower()
        user = User.objects.filter(email__iexact=email).first()
        if user and not user.deleted_at:
            _send_password_reset_email(user)
        resp = {'detail': 'If an account exists for this email, we sent reset instructions.'}
        if settings.DEBUG and user and not user.deleted_at:
            resp['debug_reset'] = {
                'uid': _uidb64(user),
                'token': default_token_generator.make_token(user),
            }
        return Response(resp)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        pk = _decode_uid(uid)
        if pk is None:
            return Response({'detail': 'Invalid uid.'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(pk=pk).first()
        if not user or not default_token_generator.check_token(user, token):
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save(update_fields=['password', 'updated_at'])
        send_password_changed_email(user.email)
        return Response({'detail': 'Password has been reset.'})


class ActivateAccountView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ActivateAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        pk = _decode_uid(uid)
        if pk is None:
            return Response({'detail': 'Invalid uid.'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(pk=pk).first()
        if not user or not account_activation_token.check_token(user, token):
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = True
        user.email_verified_at = timezone.now()
        user.save(update_fields=['is_active', 'email_verified_at', 'updated_at'])
        return Response({'detail': 'Account activated. You can log in now.'})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class MeOrgsView(APIView):
    """Organizations the current user belongs to (via UserRole). No X-Org-ID header required."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Org.objects.filter(user_roles__user=request.user)
            .distinct()
            .order_by('id')
        )
        return Response(
            list(
                qs.values('id', 'name', 'org_type', 'created_at', 'updated_at'),
            ),
        )


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeleteAccountSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.soft_delete()
        return Response({'detail': 'Account deleted.'}, status=status.HTTP_200_OK)


class JWTTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
