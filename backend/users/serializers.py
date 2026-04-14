from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'name',
            'first_name',
            'last_name',
            'phone',
            'address_line1',
            'address_line2',
            'city',
            'region',
            'postal_code',
            'country_code',
            'contact_info',
            'is_active',
            'email_verified_at',
            'deleted_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'email_verified_at', 'deleted_at', 'created_at', 'updated_at']
