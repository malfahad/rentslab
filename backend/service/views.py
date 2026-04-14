from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import Service
from .serializers import ServiceSerializer


class ServiceViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Service.objects.all().order_by('id')
    serializer_class = ServiceSerializer
    user_filter_kind = 'service'

    def _base_queryset_for_org(self, org_id: int):
        return Service.objects.filter(org_id=org_id).order_by('id')
