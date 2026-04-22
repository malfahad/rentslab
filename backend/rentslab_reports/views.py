"""Thin HTTP layer — delegates to ``report_types.registry``."""

from __future__ import annotations

from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .report_types.registry import get_report_lookup


class ReportLookupView(APIView):
    """GET ``/api/v1/reports/<slug>/`` — org-scoped stub payload."""

    permission_classes = [IsAuthenticated]

    def get(self, request, slug: str):
        if request.org_id is None:
            return Response(
                {'detail': 'Valid X-Org-ID header required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        fn = get_report_lookup(slug)
        if fn is None:
            raise NotFound('Unknown report slug.')
        params = request.query_params.dict()
        return Response(fn(org_id=request.org_id, params=params))
