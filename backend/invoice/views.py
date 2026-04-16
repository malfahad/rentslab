from decimal import Decimal

from django.db.models import (
    Case,
    DecimalField,
    ExpressionWrapper,
    F,
    OuterRef,
    Subquery,
    Sum,
    Value,
    When,
)
from django.db.models.functions import Coalesce
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from access.pagination import StandardPagination
from access.permissions import IsOrgAdminOrgHeader, RequiresOrgContext
from access.services import get_org_id_from_request
from access.view_mixins import OrgScopedViewSetMixin

from credit_note.models import CreditNote
from payment_allocation.models import PaymentAllocation

from .filters import InvoiceFilter
from .issue_serializers import IssueInvoicesRequestSerializer
from .models import Invoice
from .serializers import InvoiceSerializer
from .services import issue_invoices_for_org


class InvoiceViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('id')
    serializer_class = InvoiceSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = InvoiceFilter
    search_fields = [
        'invoice_number',
        'bill_to_name',
        'lease__tenant__name',
        'lease__unit__unit_number',
        'lease__unit__building__name',
    ]
    ordering_fields = [
        'id',
        'issue_date',
        'due_date',
        'total_amount',
        'outstanding_amount',
        'status',
        'invoice_number',
        'created_at',
        'updated_at',
    ]
    ordering = ['-issue_date', 'id']
    user_filter_kind = 'invoice'

    def _with_balance_annotations(self, qs):
        dec = DecimalField(max_digits=14, decimal_places=2)
        zero = Value(Decimal('0'), output_field=dec)
        paid_sub = (
            PaymentAllocation.objects.filter(invoice_id=OuterRef('pk'))
            .values('invoice_id')
            .annotate(total=Sum('amount_applied'))
            .values('total')[:1]
        )
        credit_sub = (
            CreditNote.objects.filter(invoice_id=OuterRef('pk'))
            .values('invoice_id')
            .annotate(total=Sum('amount'))
            .values('total')[:1]
        )
        qs = qs.annotate(
            allocated_amount=Coalesce(Subquery(paid_sub, output_field=dec), zero, output_field=dec),
            credit_note_total=Coalesce(Subquery(credit_sub, output_field=dec), zero, output_field=dec),
        )
        return qs.annotate(
            outstanding_amount=Case(
                When(
                    total_amount__lte=F('allocated_amount') + F('credit_note_total'),
                    then=zero,
                ),
                default=ExpressionWrapper(
                    F('total_amount') - F('allocated_amount') - F('credit_note_total'),
                    output_field=dec,
                ),
                output_field=dec,
            ),
        )

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related(
            'lease',
            'lease__tenant',
            'lease__unit',
            'lease__unit__building',
            'org',
        )

    def _base_queryset_for_org(self, org_id: int):
        return self._with_balance_annotations(Invoice.objects.filter(org_id=org_id)).order_by('id')

    def get_permissions(self):
        if getattr(self, 'action', None) == 'issue':
            return [IsAuthenticated(), IsOrgAdminOrgHeader()]
        return [IsAuthenticated(), RequiresOrgContext()]

    @action(detail=False, methods=['post'], url_path='issue')
    def issue(self, request):
        """Org admins: run automated invoice issuance for the current org."""
        ser = IssueInvoicesRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        org_id = get_org_id_from_request(request)
        if org_id is None:
            return Response(
                {'detail': 'Organization context required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        as_of = ser.validated_data.get('as_of')
        dry_run = ser.validated_data.get('dry_run', False)
        result = issue_invoices_for_org(org_id, as_of=as_of, dry_run=dry_run)
        return Response(result, status=status.HTTP_200_OK)
