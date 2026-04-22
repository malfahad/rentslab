import re
import uuid

from rest_framework import serializers

from .models import AccessRequest, User


def _unique_username_from_email(email: str) -> str:
    local = re.sub(r'[^a-zA-Z0-9_]', '', (email or 'user').split('@')[0])[:20] or 'user'
    return f'{local}_{uuid.uuid4().hex[:10]}'


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    org_name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def create(self, validated_data) -> User:
        email = validated_data['email']
        org_name = (validated_data.get('org_name') or '').strip() or f"{email.split('@')[0]}'s organization"
        user = User(
            username=_unique_username_from_email(email),
            email=email,
            name=email.split('@')[0][:255],
            is_active=False,
        )
        user.set_password(validated_data['password'])
        user._provision_org = True
        user._org_name = org_name
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs['email'].lower()
        password = attrs['password']
        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            raise serializers.ValidationError({'detail': 'Invalid email or password.'})
        if user.deleted_at:
            raise serializers.ValidationError({'detail': 'This account has been deleted.'})
        if not user.is_active:
            raise serializers.ValidationError({'detail': 'Account is not active. Check your email to activate.'})
        attrs['user'] = user
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)


class ActivateAccountSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value: str):
        request = self.context['request']
        user = request.user
        if not user.check_password(value):
            raise serializers.ValidationError('Password is incorrect.')
        return value


class AccessRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        return value.lower()

    def create(self, validated_data):
        access_request, _ = AccessRequest.objects.get_or_create(email=validated_data['email'])
        return access_request
