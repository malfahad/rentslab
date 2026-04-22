from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from access.permissions import RequiresOrgContext
from access.services import get_org_id_from_request

from .models import LicensePayment
from .serializers import LicensePaymentSerializer
from .services import license_summary_payload


class LicensePaymentViewSet(viewsets.ModelViewSet):
    queryset = LicensePayment.objects.all().order_by('-period_start', '-id')
    serializer_class = LicensePaymentSerializer
    permission_classes = [IsAuthenticated, RequiresOrgContext]

    def get_queryset(self):
        org_id = get_org_id_from_request(self.request)
        if org_id is None:
            return LicensePayment.objects.none()
        return (
            LicensePayment.objects.filter(org_id=org_id)
            .select_related('org', 'tenant')
            .order_by('-period_start', '-id')
        )

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        org_id = get_org_id_from_request(request)
        if org_id is None:
            return Response({'detail': 'Valid X-Org-ID header required.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(license_summary_payload(org_id))
