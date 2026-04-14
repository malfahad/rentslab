import django_filters

from .models import Lease


class LeaseFilter(django_filters.FilterSet):
    class Meta:
        model = Lease
        fields = {
            'tenant': ['exact'],
            'unit': ['exact'],
            'status': ['exact', 'icontains'],
        }
