"""Tests for :func:`access.services.user_filtered_results`."""

from django.test import TestCase

from access.constants import PERM_VIEW, SCOPE_BUILDING, SCOPE_ORG
from access.models import ShareGrant
from access.services import user_filtered_results
from building.models import Building
from test_helpers import create_building, create_landlord, create_org, create_user, create_user_role


class UserFilteredResultsTests(TestCase):
    def test_admin_sees_all_buildings_in_org(self):
        org = create_org()
        ll = create_landlord(org=org)
        b1 = create_building(org=org, landlord=ll)
        b2 = create_building(org=org, landlord=ll)
        admin = create_user(suffix='adm')
        create_user_role(user=admin, org=org, role='org_admin')
        qs = Building.objects.filter(org_id=org.pk)
        out = user_filtered_results(admin, org.pk, qs, kind='building')
        self.assertEqual(set(out.values_list('pk', flat=True)), {b1.pk, b2.pk})

    def test_org_wide_view_sees_all_buildings(self):
        org = create_org()
        ll = create_landlord(org=org)
        b1 = create_building(org=org, landlord=ll)
        member = create_user(suffix='m1')
        create_user_role(user=member, org=org, role='org_member')
        ShareGrant.objects.create(
            org=org,
            scope=SCOPE_ORG,
            object_id=None,
            grantee=member,
            permission_level=PERM_VIEW,
        )
        qs = Building.objects.filter(org_id=org.pk)
        out = user_filtered_results(member, org.pk, qs, kind='building')
        self.assertEqual(set(out.values_list('pk', flat=True)), {b1.pk})

    def test_building_grant_limits_buildings(self):
        org = create_org()
        ll = create_landlord(org=org)
        b1 = create_building(org=org, landlord=ll)
        b2 = create_building(org=org, landlord=ll)
        member = create_user(suffix='m2')
        create_user_role(user=member, org=org, role='org_member')
        ShareGrant.objects.create(
            org=org,
            scope=SCOPE_BUILDING,
            object_id=b1.pk,
            grantee=member,
            permission_level=PERM_VIEW,
        )
        qs = Building.objects.filter(org_id=org.pk)
        out = user_filtered_results(member, org.pk, qs, kind='building')
        self.assertEqual(list(out.values_list('pk', flat=True)), [b1.pk])

    def test_no_grants_returns_empty(self):
        org = create_org()
        ll = create_landlord(org=org)
        create_building(org=org, landlord=ll)
        member = create_user(suffix='m3')
        create_user_role(user=member, org=org, role='org_member')
        qs = Building.objects.filter(org_id=org.pk)
        out = user_filtered_results(member, org.pk, qs, kind='building')
        self.assertEqual(list(out), [])
