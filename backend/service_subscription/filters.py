import django_filters

from .models import ServiceSubscription


class ServiceSubscriptionFilter(django_filters.FilterSet):
    class Meta:
        model = ServiceSubscription
        fields = ['lease']
