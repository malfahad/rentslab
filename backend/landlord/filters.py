import django_filters

from .models import Landlord


class LandlordFilter(django_filters.FilterSet):
    class Meta:
        model = Landlord
        fields = {
            'city': ['icontains'],
            'region': ['icontains'],
            'country_code': ['iexact'],
        }
