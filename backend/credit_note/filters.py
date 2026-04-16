import django_filters

from .models import CreditNote


class CreditNoteFilter(django_filters.FilterSet):
    class Meta:
        model = CreditNote
        fields = {
            'invoice': ['exact'],
            'invoice__lease': ['exact'],
            'invoice__lease__tenant': ['exact'],
            'invoice__lease__unit': ['exact'],
            'invoice__lease__unit__building': ['exact'],
        }
