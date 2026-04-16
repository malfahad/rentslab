import django_filters

from .models import Payment


class PaymentFilter(django_filters.FilterSet):
    class Meta:
        model = Payment
        fields = {
            'tenant': ['exact'],
            'lease': ['exact'],
            'method': ['exact'],
            'lease__unit': ['exact'],
            'lease__unit__building': ['exact'],
        }
