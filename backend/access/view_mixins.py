"""Shared DRF patterns for org-scoped, share-filtered resources."""

from __future__ import annotations

from rest_framework.permissions import IsAuthenticated

from access.permissions import RequiresOrgContext
from access.services import get_org_id_from_request, user_filtered_results


class OrgScopedViewSetMixin:
    """
    Authenticated requests with ``X-Org-ID``; queryset is org-scoped then narrowed by
    :func:`access.services.user_filtered_results` using ``user_filter_kind``.
    """

    permission_classes = [IsAuthenticated, RequiresOrgContext]
    user_filter_kind: str = 'building'

    def get_queryset(self):
        org_id = get_org_id_from_request(self.request)
        if org_id is None:
            return self.queryset.model.objects.none()
        qs = self._base_queryset_for_org(org_id)
        return user_filtered_results(self.request.user, org_id, qs, kind=self.user_filter_kind)

    def _base_queryset_for_org(self, org_id: int):
        raise NotImplementedError
