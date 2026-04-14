from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import ExpenseCategory
from .serializers import ExpenseCategorySerializer


class ExpenseCategoryViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all().order_by('sort_order', 'id')
    serializer_class = ExpenseCategorySerializer
    user_filter_kind = 'expense_category'

    def _base_queryset_for_org(self, org_id: int):
        return ExpenseCategory.objects.filter(org_id=org_id).order_by('sort_order', 'id')
