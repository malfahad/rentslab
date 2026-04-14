"""Attach org context from X-Org-ID when the user belongs to that org."""

from __future__ import annotations

from access.services import get_org_id_from_request, user_has_org_membership


class OrgContextMiddleware:
    """Sets ``request.org_id`` when ``X-Org-ID`` is valid for the authenticated user."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.org_id = None
        request.org = None
        if request.user.is_authenticated:
            oid = get_org_id_from_request(request)
            if oid is not None and user_has_org_membership(request.user, oid):
                request.org_id = oid
                from org.models import Org

                request.org = Org.objects.filter(pk=oid).first()
        return self.get_response(request)
