import django_filters

from .models import Expense


class ExpenseFilter(django_filters.FilterSet):
    class Meta:
        model = Expense
        fields = {
            'status': ['exact'],
        }
