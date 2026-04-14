"""Shared factories for tests (no dependency on pytest)."""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from django.contrib.auth import get_user_model

User = get_user_model()


def create_org(**kwargs: Any):
    from org.models import Org

    return Org.objects.create(
        name=kwargs.get('name', 'Test Org'),
        org_type=kwargs.get('org_type', 'property_manager'),
    )


def create_user(**kwargs: Any):
    suffix = kwargs.pop('suffix', None) or 'u1'
    username = kwargs.pop('username', f'user_{suffix}')
    email = kwargs.pop('email', f'{username}@example.com')
    password = kwargs.pop('password', 'testpass123')
    return User.objects.create_user(
        username=username,
        email=email,
        password=password,
        **kwargs,
    )


def create_user_role(user=None, org=None, **kwargs):
    from access.constants import ROLE_ADMIN
    from access.models import RoleDefinition
    from access.services import provision_default_roles_for_org
    from user_role.models import UserRole

    if org is None:
        org = create_org()
    if user is None:
        user = create_user(suffix=str(org.pk))
    provision_default_roles_for_org(org)
    legacy = kwargs.pop('role', None)
    if legacy is None:
        legacy = kwargs.pop('role_key', ROLE_ADMIN)
    key_map = {
        'org_admin': ROLE_ADMIN,
        'property_manager': 'org_member',
        'read_only': 'org_member',
    }
    role_key = key_map.get(legacy, legacy)
    rd, _ = RoleDefinition.objects.get_or_create(
        org=org,
        key=role_key,
        defaults={'name': role_key.replace('_', ' ').title(), 'is_system': False},
    )
    return UserRole.objects.create(user=user, org=org, role_definition=rd)


def auth_client_for_org(client, org, user=None, *, as_admin: bool = True):
    """
    Attach an authenticated user to ``org`` (UserRole) and set ``X-Org-ID`` on ``client``
    for org-scoped API tests.
    """
    if user is None:
        user = create_user(suffix=f'adm{org.pk}')
    role = 'org_admin' if as_admin else 'org_member'
    create_user_role(user=user, org=org, role=role)
    client.force_authenticate(user=user)
    client.credentials(HTTP_X_ORG_ID=str(org.pk))
    return user


def create_landlord(org=None, **kwargs):
    from landlord.models import Landlord

    if org is None:
        org = create_org()
    return Landlord.objects.create(org=org, name=kwargs.get('name', 'Test Landlord'))


def create_building(org=None, landlord=None, **kwargs):
    from building.models import Building

    if org is None:
        org = create_org()
    if landlord is None:
        landlord = create_landlord(org=org)
    return Building.objects.create(
        org=org,
        landlord=landlord,
        name=kwargs.get('name', 'Test Building'),
        building_type=kwargs.get('building_type', 'residential'),
    )


def create_unit(building=None, **kwargs):
    from unit.models import Unit

    if building is None:
        building = create_building()
    return Unit.objects.create(
        building=building,
        unit_number=kwargs.get('unit_number', '101'),
        unit_type=kwargs.get('unit_type', 'apartment'),
        status=kwargs.get('status', 'vacant'),
    )


def create_tenant(org=None, **kwargs):
    from tenant.models import Tenant

    if org is None:
        org = create_org()
    return Tenant.objects.create(
        org=org,
        name=kwargs.get('name', 'Test Tenant'),
        tenant_type=kwargs.get('tenant_type', 'individual'),
    )


def create_lease(unit=None, tenant=None, managed_by=None, **kwargs):
    from lease.models import Lease

    if unit is None:
        unit = create_unit()
    if tenant is None:
        tenant = create_tenant(org=unit.building.org)
    return Lease.objects.create(
        unit=unit,
        tenant=tenant,
        managed_by=managed_by,
        start_date=kwargs.get('start_date', date(2025, 1, 1)),
        end_date=kwargs.get('end_date'),
        rent_amount=kwargs.get('rent_amount', Decimal('1000.00')),
        deposit_amount=kwargs.get('deposit_amount'),
        billing_cycle=kwargs.get('billing_cycle', 'monthly'),
        status=kwargs.get('status', 'active'),
    )


def create_service(org=None, **kwargs):
    from service.models import Service

    if org is None:
        org = create_org()
    return Service.objects.create(
        org=org,
        name=kwargs.get('name', 'Water'),
        billing_type=kwargs.get('billing_type', 'fixed'),
        currency=kwargs.get('currency', ''),
        is_active=kwargs.get('is_active', True),
    )


def create_service_subscription(lease=None, service=None, **kwargs):
    from service_subscription.models import ServiceSubscription

    if lease is None:
        lease = create_lease()
    if service is None:
        service = create_service(org=lease.unit.building.org)
    return ServiceSubscription.objects.create(
        lease=lease,
        service=service,
        rate=kwargs.get('rate', Decimal('50.00')),
        currency=kwargs.get('currency', ''),
        billing_cycle=kwargs.get('billing_cycle', 'monthly'),
    )


def create_invoice(lease=None, org=None, **kwargs):
    from invoice.models import Invoice

    if lease is None:
        lease = create_lease()
    if org is None:
        org = lease.unit.building.org
    return Invoice.objects.create(
        lease=lease,
        org=org,
        invoice_number=kwargs.get('invoice_number', ''),
        issue_date=kwargs.get('issue_date', date(2025, 2, 1)),
        due_date=kwargs.get('due_date', date(2025, 2, 15)),
        total_amount=kwargs.get('total_amount', Decimal('1000.00')),
        status=kwargs.get('status', 'unpaid'),
    )


def create_invoice_line_item(invoice=None, **kwargs):
    from invoice_line_item.models import InvoiceLineItem

    if invoice is None:
        invoice = create_invoice()
    return InvoiceLineItem.objects.create(
        invoice=invoice,
        line_number=kwargs.get('line_number', 1),
        description=kwargs.get('description', 'Rent'),
        amount=kwargs.get('amount', Decimal('1000.00')),
        service=kwargs.get('service'),
    )


def create_credit_note(invoice=None, **kwargs):
    from credit_note.models import CreditNote

    if invoice is None:
        invoice = create_invoice()
    return CreditNote.objects.create(
        invoice=invoice,
        amount=kwargs.get('amount', Decimal('100.00')),
        reason=kwargs.get('reason', 'Adjustment'),
        credit_date=kwargs.get('credit_date', date(2025, 2, 10)),
    )


def create_payment(org=None, tenant=None, lease=None, **kwargs):
    from payment.models import Payment

    if lease is not None:
        org = lease.unit.building.org
        tenant = lease.tenant
    if org is None:
        org = create_org()
    if tenant is None:
        tenant = create_tenant(org=org)
    return Payment.objects.create(
        org=org,
        tenant=tenant,
        lease=lease,
        amount=kwargs.get('amount', Decimal('500.00')),
        method=kwargs.get('method', 'bank'),
        reference=kwargs.get('reference', ''),
        payment_date=kwargs.get('payment_date', datetime(2025, 2, 5, 12, 0, 0, tzinfo=timezone.utc)),
    )


def create_payment_allocation(payment=None, invoice=None, **kwargs):
    from payment_allocation.models import PaymentAllocation

    if payment is None:
        payment = create_payment()
    if invoice is None:
        if payment.lease_id:
            invoice = create_invoice(lease=payment.lease, org=payment.org)
        else:
            landlord = create_landlord(org=payment.org)
            building = create_building(org=payment.org, landlord=landlord)
            unit = create_unit(building=building, unit_number='alloc-u')
            lease = create_lease(unit=unit, tenant=payment.tenant)
            invoice = create_invoice(lease=lease, org=payment.org)
    return PaymentAllocation.objects.create(
        payment=payment,
        invoice=invoice,
        amount_applied=kwargs.get('amount_applied', Decimal('500.00')),
    )


def create_vendor(org=None, **kwargs):
    from vendor.models import Vendor

    if org is None:
        org = create_org()
    return Vendor.objects.create(
        org=org,
        name=kwargs.get('name', 'Test Vendor'),
        vendor_type=kwargs.get('vendor_type', ''),
        is_active=kwargs.get('is_active', True),
    )


def create_expense_category(org=None, **kwargs):
    from expense_category.models import ExpenseCategory

    if org is None:
        org = create_org()
    return ExpenseCategory.objects.create(
        org=org,
        name=kwargs.get('name', 'Repairs'),
        code=kwargs.get('code', ''),
        is_active=kwargs.get('is_active', True),
    )


def create_job_order(org=None, building=None, **kwargs):
    from job_order.models import JobOrder

    if building is None:
        building = create_building()
    if org is None:
        org = building.org
    return JobOrder.objects.create(
        org=org,
        job_number=kwargs.get('job_number', 'WO-001'),
        building=building,
        unit=kwargs.get('unit'),
        vendor=kwargs.get('vendor'),
        title=kwargs.get('title', 'Fix leak'),
        status=kwargs.get('status', 'open'),
    )


def create_expense(org=None, expense_category=None, **kwargs):
    from expense.models import Expense

    if org is None:
        org = create_org()
    if expense_category is None:
        expense_category = create_expense_category(org=org)
    return Expense.objects.create(
        org=org,
        expense_category=expense_category,
        expense_date=kwargs.get('expense_date', date(2025, 3, 1)),
        amount=kwargs.get('amount', Decimal('100.00')),
        description=kwargs.get('description', 'Supplies'),
        status=kwargs.get('status', 'draft'),
        building=kwargs.get('building'),
        unit=kwargs.get('unit'),
        lease=kwargs.get('lease'),
        vendor=kwargs.get('vendor'),
        job_order=kwargs.get('job_order'),
    )


def build_full_graph():
    """Return a dict of linked objects for integration-style tests."""
    org = create_org(name='Graph Org')
    staff = create_user(username='graph_staff', email='gs@example.com')
    create_user_role(user=staff, org=org, role='property_manager')
    landlord = create_landlord(org=org, name='Graph LL')
    building = create_building(org=org, landlord=landlord, name='Graph Tower')
    unit = create_unit(building=building, unit_number='7A')
    tenant = create_tenant(org=org, name='Graph Tenant')
    lease = create_lease(unit=unit, tenant=tenant, managed_by=staff)
    svc = create_service(org=org, name='Security')
    sub = create_service_subscription(lease=lease, service=svc)
    inv = create_invoice(lease=lease, org=org, invoice_number='INV-001')
    line = create_invoice_line_item(invoice=inv, description='Monthly rent', amount=Decimal('1000.00'))
    pay = create_payment(org=org, tenant=tenant, lease=lease, amount=Decimal('1000.00'))
    alloc = create_payment_allocation(payment=pay, invoice=inv, amount_applied=Decimal('1000.00'))
    cn = create_credit_note(invoice=inv, amount=Decimal('50.00'))

    return {
        'org': org,
        'staff': staff,
        'landlord': landlord,
        'building': building,
        'unit': unit,
        'tenant': tenant,
        'lease': lease,
        'service': svc,
        'subscription': sub,
        'invoice': inv,
        'line_item': line,
        'payment': pay,
        'allocation': alloc,
        'credit_note': cn,
    }
