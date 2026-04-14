from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import ServiceSubscription
from .serializers import ServiceSubscriptionSerializer


class ServiceSubscriptionViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = ServiceSubscription.objects.all().order_by('id')
    serializer_class = ServiceSubscriptionSerializer
    user_filter_kind = 'service_subscription'

    def _base_queryset_for_org(self, org_id: int):
        return ServiceSubscription.objects.filter(lease__unit__building__org_id=org_id).order_by('id')
