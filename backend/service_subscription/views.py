from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from access.pagination import StandardPagination
from access.view_mixins import OrgScopedViewSetMixin

from .filters import ServiceSubscriptionFilter
from .models import ServiceSubscription
from .serializers import ServiceSubscriptionSerializer


class ServiceSubscriptionViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = ServiceSubscription.objects.all().order_by('id')
    serializer_class = ServiceSubscriptionSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = ServiceSubscriptionFilter
    user_filter_kind = 'service_subscription'

    def get_queryset(self):
        return super().get_queryset().select_related('lease', 'service')

    def _base_queryset_for_org(self, org_id: int):
        return ServiceSubscription.objects.filter(lease__unit__building__org_id=org_id).order_by('id')
