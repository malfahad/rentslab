from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import JobOrder
from .serializers import JobOrderSerializer


class JobOrderViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = JobOrder.objects.all().order_by('-created_at', 'id')
    serializer_class = JobOrderSerializer
    user_filter_kind = 'job_order'

    def _base_queryset_for_org(self, org_id: int):
        return JobOrder.objects.filter(org_id=org_id).order_by('-created_at', 'id')
