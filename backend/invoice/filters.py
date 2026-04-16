import django_filters

from .models import Invoice


class InvoiceFilter(django_filters.FilterSet):
    class Meta:
        model = Invoice
        fields = {
            'status': ['exact'],
            'lease': ['exact'],
            'lease__tenant': ['exact'],
            'lease__unit': ['exact'],
            'lease__unit__building': ['exact'],
        }
