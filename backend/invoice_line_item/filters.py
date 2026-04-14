import django_filters

from .models import InvoiceLineItem


class InvoiceLineItemFilter(django_filters.FilterSet):
    class Meta:
        model = InvoiceLineItem
        fields = {
            'invoice': ['exact'],
        }
