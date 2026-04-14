from rest_framework import viewsets

from access.view_mixins import OrgScopedViewSetMixin

from .models import CreditNote
from .serializers import CreditNoteSerializer


class CreditNoteViewSet(OrgScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = CreditNote.objects.all().order_by('id')
    serializer_class = CreditNoteSerializer
    user_filter_kind = 'credit_note'

    def _base_queryset_for_org(self, org_id: int):
        return CreditNote.objects.filter(invoice__org_id=org_id).order_by('id')
