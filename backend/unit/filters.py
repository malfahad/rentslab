import django_filters

from .models import Unit


class UnitFilter(django_filters.FilterSet):
    available_for_lease = django_filters.BooleanFilter(method='filter_available_for_lease')

    def filter_available_for_lease(self, queryset, name, value):
        if value is not True:
            return queryset
        from lease.models import Lease

        return (
            queryset.exclude(leases__status='active')
            .exclude(status='maintenance')
            .distinct()
        )

    class Meta:
        model = Unit
        fields = {
            'status': ['exact'],
            'unit_type': ['exact'],
            'building': ['exact'],
        }
