from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import Lease
from .serializers import LeaseSerializer


class LeaseViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Lease.objects.all().order_by('id')
    serializer_class = LeaseSerializer
    user_filter_kind = 'lease'

    def _base_queryset_for_org(self, org_id: int):
        return Lease.objects.filter(unit__building__org_id=org_id).order_by('id')
