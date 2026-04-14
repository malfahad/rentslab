import django_filters

from .models import Building


class BuildingFilter(django_filters.FilterSet):
    class Meta:
        model = Building
        fields = {
            'city': ['icontains'],
            'building_type': ['exact'],
            'landlord': ['exact'],
        }
