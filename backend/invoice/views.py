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
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from access.pagination import StandardPagination
from access.permissions import IsOrgAdminOrgHeader, RequiresOrgContext
from access.services import get_org_id_from_request
from access.view_mixins import OrgScopedViewSetMixin

from credit_note.models import CreditNote
from invoice_line_item.models import InvoiceLineItem
from payment_allocation.models import PaymentAllocation
from service_subscription.models import ServiceSubscription

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


class PublicInvoiceDocumentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, hashed_doc_id: str):
        invoice_id = Invoice.decode_public_doc_id(hashed_doc_id)
        if invoice_id is None:
            return Response({'detail': 'Invoice document not found.'}, status=404)
        invoice = (
            Invoice.objects.select_related(
                'org',
                'lease',
                'lease__tenant',
                'lease__unit',
                'lease__unit__building',
                'lease__unit__building__landlord',
            )
            .filter(pk=invoice_id)
            .first()
        )
        if invoice is None:
            return Response({'detail': 'Invoice document not found.'}, status=404)

        line_items = list(
            InvoiceLineItem.objects.filter(invoice=invoice)
            .select_related('service')
            .order_by('line_number', 'id')
            .values(
                'id',
                'line_number',
                'description',
                'amount',
                'billing_period_start',
                'billing_period_end',
                'service__name',
            )
        )
        subs = list(
            ServiceSubscription.objects.filter(lease=invoice.lease)
            .select_related('service')
            .order_by('id')
            .values('id', 'service', 'service__name', 'rate', 'currency', 'billing_cycle')
        )
        building = invoice.lease.unit.building
        landlord = building.landlord
        org = invoice.org
        return Response(
            {
                'invoice': InvoiceSerializer(invoice).data,
                'line_items': [
                    {
                        'id': row['id'],
                        'line_number': row['line_number'],
                        'description': row['description'],
                        'amount': str(row['amount']),
                        'billing_period_start': row['billing_period_start'],
                        'billing_period_end': row['billing_period_end'],
                        'service_name': row['service__name'],
                    }
                    for row in line_items
                ],
                'lease': {
                    'id': invoice.lease.id,
                    'start_date': invoice.lease.start_date,
                    'end_date': invoice.lease.end_date,
                    'rent_amount': str(invoice.lease.rent_amount),
                    'rent_currency': invoice.lease.rent_currency,
                },
                'tenant': {
                    'id': invoice.lease.tenant.id,
                    'name': invoice.lease.tenant.name,
                    'email': invoice.lease.tenant.email,
                    'phone': invoice.lease.tenant.phone,
                    'address_line1': invoice.lease.tenant.address_line1,
                    'address_line2': invoice.lease.tenant.address_line2,
                    'city': invoice.lease.tenant.city,
                    'region': invoice.lease.tenant.region,
                    'postal_code': invoice.lease.tenant.postal_code,
                    'country_code': invoice.lease.tenant.country_code,
                },
                'unit': {
                    'id': invoice.lease.unit.id,
                    'unit_number': invoice.lease.unit.unit_number,
                    'unit_type': invoice.lease.unit.unit_type,
                    'floor': invoice.lease.unit.floor,
                    'size': str(invoice.lease.unit.size) if invoice.lease.unit.size is not None else None,
                    'payment_code': invoice.lease.unit.payment_code,
                },
                'building': {
                    'id': building.id,
                    'name': building.name,
                    'address_line1': building.address_line1,
                    'address_line2': building.address_line2,
                    'city': building.city,
                    'region': building.region,
                    'postal_code': building.postal_code,
                    'country_code': building.country_code,
                },
                'landlord': {
                    'id': landlord.id,
                    'name': landlord.name,
                    'legal_name': landlord.legal_name,
                    'email': landlord.email,
                    'phone': landlord.phone,
                    'address_line1': landlord.address_line1,
                    'address_line2': landlord.address_line2,
                    'city': landlord.city,
                    'region': landlord.region,
                    'postal_code': landlord.postal_code,
                    'country_code': landlord.country_code,
                },
                'org': (
                    {
                        'id': org.id,
                        'name': org.name,
                        'address_line1': org.address_line1,
                        'address_line2': org.address_line2,
                        'city': org.city,
                        'region': org.region,
                        'postal_code': org.postal_code,
                        'country_code': org.country_code,
                        'settings': org.settings if isinstance(org.settings, dict) else {},
                    }
                    if org is not None
                    else None
                ),
                'subscriptions': [
                    {
                        'id': row['id'],
                        'service': row['service'],
                        'service_name': row['service__name'],
                        'rate': str(row['rate']),
                        'currency': row['currency'],
                        'billing_cycle': row['billing_cycle'],
                    }
                    for row in subs
                ],
            }
        )
