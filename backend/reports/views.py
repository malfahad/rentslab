"""Thin HTTP layer — delegates to ``report_types.registry``."""

from __future__ import annotations

from access.services import get_org_id_from_request, user_has_org_membership
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .report_types.registry import REPORT_LOOKUPS, get_report_lookup


class ReportViewSet(viewsets.ViewSet):
    """
    Org-scoped reports.

    * ``GET /api/v1/reports/`` — available report slugs
    * ``GET /api/v1/reports/<slug>/`` — payload for one report (query params pass through)
    """

    permission_classes = [IsAuthenticated]

    def _resolve_org_id(self, request) -> int | None:
        """
        Resolve org context from header after DRF auth has populated request.user.
        """
        oid = get_org_id_from_request(request)
        if oid is None:
            return None
        if not user_has_org_membership(request.user, oid):
            return None
        return oid

    def list(self, request):
        org_id = self._resolve_org_id(request)
        if org_id is None:
            return Response(
                {'detail': 'Valid X-Org-ID header required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({'reports': sorted(REPORT_LOOKUPS.keys())})

    def retrieve(self, request, pk=None):
        org_id = self._resolve_org_id(request)
        if org_id is None:
            return Response(
                {'detail': 'Valid X-Org-ID header required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        slug = pk
        fn = get_report_lookup(slug)
        if fn is None:
            raise NotFound('Unknown report slug.')
        params = request.query_params.dict()
        return Response(fn(org_id=org_id, params=params))
