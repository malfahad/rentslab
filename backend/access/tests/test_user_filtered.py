"""Tests for :func:`access.services.user_filtered_results`."""

from django.test import TestCase

from access.constants import PERM_VIEW, SCOPE_BUILDING, SCOPE_ORG
from access.models import ShareGrant
from access.services import user_filtered_results
from building.models import Building
from job_order.models import JobOrder
from test_helpers import (
    create_building,
    create_landlord,
    create_org,
    create_job_order,
    create_expense,
    create_expense_category,
    create_user,
    create_user_role,
)
from expense.models import Expense


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

    def test_building_grant_limits_job_orders(self):
        org = create_org()
        ll = create_landlord(org=org)
        b1 = create_building(org=org, landlord=ll)
        b2 = create_building(org=org, landlord=ll)
        jo1 = create_job_order(org=org, building=b1, job_number='WO-A')
        create_job_order(org=org, building=b2, job_number='WO-B')
        member = create_user(suffix='mjo')
        create_user_role(user=member, org=org, role='org_member')
        ShareGrant.objects.create(
            org=org,
            scope=SCOPE_BUILDING,
            object_id=b1.pk,
            grantee=member,
            permission_level=PERM_VIEW,
        )
        qs = JobOrder.objects.filter(org_id=org.pk)
        out = user_filtered_results(member, org.pk, qs, kind='job_order')
        self.assertEqual(list(out.values_list('pk', flat=True)), [jo1.pk])

    def test_building_grant_limits_expenses(self):
        org = create_org()
        ll = create_landlord(org=org)
        b1 = create_building(org=org, landlord=ll)
        b2 = create_building(org=org, landlord=ll)
        cat = create_expense_category(org=org)
        e1 = create_expense(org=org, expense_category=cat, building=b1, description='On B1')
        create_expense(org=org, expense_category=cat, building=b2, description='On B2')
        member = create_user(suffix='mex')
        create_user_role(user=member, org=org, role='org_member')
        ShareGrant.objects.create(
            org=org,
            scope=SCOPE_BUILDING,
            object_id=b1.pk,
            grantee=member,
            permission_level=PERM_VIEW,
        )
        qs = Expense.objects.filter(org_id=org.pk)
        out = user_filtered_results(member, org.pk, qs, kind='expense')
        self.assertEqual(list(out.values_list('pk', flat=True)), [e1.pk])
