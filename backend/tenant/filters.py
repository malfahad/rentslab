import django_filters

from .models import Tenant


class TenantFilter(django_filters.FilterSet):
    class Meta:
        model = Tenant
        fields = {
            'tenant_type': ['exact'],
        }
