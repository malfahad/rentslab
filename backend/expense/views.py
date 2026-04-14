from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-expense_date', 'id')
    serializer_class = ExpenseSerializer
    user_filter_kind = 'expense'

    def _base_queryset_for_org(self, org_id: int):
        return Expense.objects.filter(org_id=org_id).order_by('-expense_date', 'id')
