import django_filters

from .models import PaymentAllocation


class PaymentAllocationFilter(django_filters.FilterSet):
    class Meta:
        model = PaymentAllocation
        fields = {
            'payment': ['exact'],
            'invoice': ['exact'],
        }
