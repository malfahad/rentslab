from datetime import date as date_cls

from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin
from service_subscription.models import ServiceSubscription

from .filters import LeaseFilter
from .models import Lease
from .serializers import LeaseSerializer


class LeaseViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Lease.objects.all().order_by('id')
    serializer_class = LeaseSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = LeaseFilter
    search_fields = [
        'status',
        'external_reference',
        'unit__unit_number',
        'unit__building__name',
    ]
    ordering_fields = [
        'id',
        'start_date',
        'end_date',
        'rent_amount',
        'status',
        'created_at',
        'updated_at',
    ]
    ordering = ['id']
    user_filter_kind = 'lease'

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related('unit', 'unit__building', 'unit__building__landlord', 'tenant', 'managed_by')

    def _base_queryset_for_org(self, org_id: int):
        return Lease.objects.filter(unit__building__org_id=org_id).order_by('id')

    def destroy(self, request, *args, **kwargs):
        return Response(
            {
                'detail': (
                    'Leases cannot be deleted. Close the lease instead '
                    '(POST /api/v1/leases/<id>/close/) to stop billing and retain history.'
                ),
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=['post'], url_path='close')
    def close(self, request, pk=None):
        """
        Soft-close: set status to closed and end_date to today (or optional closing_date).
        Closed leases are excluded from automated invoice issuance.
        """
        lease = self.get_object()
        if lease.status != 'active':
            return Response(
                {'detail': 'Only active leases can be closed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        closing_raw = request.data.get('closing_date')
        if closing_raw not in (None, ''):
            try:
                close_date = date_cls.fromisoformat(str(closing_raw))
            except (ValueError, TypeError):
                return Response(
                    {'closing_date': ['Invalid date. Use ISO format YYYY-MM-DD.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            close_date = timezone.now().date()
        lease.status = 'closed'
        lease.end_date = close_date
        lease.save(update_fields=['status', 'end_date', 'updated_at'])
        return Response(self.get_serializer(lease).data)


class PublicLeaseDocumentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, hashed_doc_id: str):
        lease_id = Lease.decode_public_doc_id(hashed_doc_id)
        if lease_id is None:
            return Response({'detail': 'Lease document not found.'}, status=404)
        lease = (
            Lease.objects.select_related(
                'tenant',
                'unit',
                'unit__building',
                'unit__building__landlord',
                'unit__building__org',
            )
            .filter(pk=lease_id)
            .first()
        )
        if lease is None:
            return Response({'detail': 'Lease document not found.'}, status=404)
        subs = list(
            ServiceSubscription.objects.filter(lease=lease)
            .select_related('service')
            .order_by('id')
            .values('id', 'service', 'service__name', 'rate', 'currency', 'billing_cycle')
        )
        b = lease.unit.building
        ll = b.landlord
        org = b.org
        return Response(
            {
                'lease': LeaseSerializer(lease).data,
                'tenant': {
                    'id': lease.tenant.id,
                    'name': lease.tenant.name,
                    'email': lease.tenant.email,
                    'phone': lease.tenant.phone,
                    'address_line1': lease.tenant.address_line1,
                    'address_line2': lease.tenant.address_line2,
                    'city': lease.tenant.city,
                    'region': lease.tenant.region,
                    'postal_code': lease.tenant.postal_code,
                    'country_code': lease.tenant.country_code,
                    'tax_id': lease.tenant.tax_id,
                    'company_registration_number': lease.tenant.company_registration_number,
                },
                'unit': {
                    'id': lease.unit.id,
                    'unit_number': lease.unit.unit_number,
                    'unit_type': lease.unit.unit_type,
                    'floor': lease.unit.floor,
                    'size': str(lease.unit.size) if lease.unit.size is not None else None,
                    'payment_code': lease.unit.payment_code,
                },
                'building': {
                    'id': b.id,
                    'name': b.name,
                    'address_line1': b.address_line1,
                    'address_line2': b.address_line2,
                    'city': b.city,
                    'region': b.region,
                    'postal_code': b.postal_code,
                    'country_code': b.country_code,
                },
                'landlord': {
                    'id': ll.id,
                    'name': ll.name,
                    'legal_name': ll.legal_name,
                    'email': ll.email,
                    'phone': ll.phone,
                    'address_line1': ll.address_line1,
                    'address_line2': ll.address_line2,
                    'city': ll.city,
                    'region': ll.region,
                    'postal_code': ll.postal_code,
                    'country_code': ll.country_code,
                },
                'org': {
                    'id': org.id,
                    'name': org.name,
                    'settings': org.settings if isinstance(org.settings, dict) else {},
                },
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
