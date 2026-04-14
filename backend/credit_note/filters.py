import django_filters

from .models import CreditNote


class CreditNoteFilter(django_filters.FilterSet):
    class Meta:
        model = CreditNote
        fields = {
            'invoice': ['exact'],
        }
