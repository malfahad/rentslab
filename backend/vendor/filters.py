import django_filters

from .models import Vendor


class VendorFilter(django_filters.FilterSet):
    class Meta:
        model = Vendor
        fields = {
            'city': ['icontains'],
            'region': ['icontains'],
            'country_code': ['iexact'],
            'is_active': ['exact'],
        }
