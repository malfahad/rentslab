from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

from .filters import ExpenseFilter
from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-expense_date', 'id')
    serializer_class = ExpenseSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ExpenseFilter
    search_fields = ['description', 'expense_number', 'reference']
    ordering_fields = ['id', 'expense_date', 'amount', 'status', 'created_at']
    ordering = ['-expense_date', 'id']
    user_filter_kind = 'expense'

    def _base_queryset_for_org(self, org_id: int):
        return Expense.objects.filter(org_id=org_id).order_by('-expense_date', 'id')
