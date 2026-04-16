from datetime import date as date_cls

from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

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
        return qs.select_related('unit', 'unit__building', 'tenant', 'managed_by')

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
