"""Tenant-notification orchestration for SMS scenarios."""

from __future__ import annotations

from decimal import Decimal

from invoice.models import Invoice
from job_order.models import JobOrder
from lease.models import Lease
from org.models import Org
from payment.models import Payment
from tenant.models import Tenant

from .sender import (
    notify_invoice_issued,
    notify_invoice_paid,
    notify_job_order_update,
    notify_lease_activated,
    notify_lease_closed,
    notify_payment_received,
    notify_tenant_welcome,
)


def org_sms_enabled(org: Org | None) -> bool:
    if org is None:
        return False
    return bool(getattr(org, 'sms_notifications_enabled', True))


def _tenant_has_phone(tenant: Tenant | None) -> bool:
    return bool(tenant and (tenant.phone or '').strip())


def send_tenant_welcome_sms(tenant: Tenant) -> None:
    if not org_sms_enabled(tenant.org) or not _tenant_has_phone(tenant):
        return
    notify_tenant_welcome(
        tenant_name=tenant.name,
        building_name=_tenant_building_name(tenant) or tenant.org.name,
        tenant_phone=tenant.phone,
    )


def send_lease_activated_sms(lease: Lease) -> None:
    tenant = lease.tenant
    org = tenant.org if tenant else None
    if not org_sms_enabled(org) or not _tenant_has_phone(tenant):
        return
    notify_lease_activated(
        tenant_name=tenant.name,
        tenant_phone=tenant.phone,
        unit_label=_unit_label(lease),
        amount=lease.rent_amount or Decimal('0'),
        currency=(lease.rent_currency or '').strip(),
        billing_cycle=lease.billing_cycle,
    )


def send_lease_closed_sms(lease: Lease) -> None:
    tenant = lease.tenant
    org = tenant.org if tenant else None
    if not org_sms_enabled(org) or not _tenant_has_phone(tenant):
        return
    notify_lease_closed(
        tenant_name=tenant.name,
        tenant_phone=tenant.phone,
        unit_label=_unit_label(lease),
        lease_status=lease.status,
        org_name=org.name,
    )


def send_invoice_issued_sms(invoice: Invoice) -> None:
    lease = invoice.lease
    tenant = lease.tenant if lease else None
    org = invoice.org or (tenant.org if tenant else None)
    if not org_sms_enabled(org) or not _tenant_has_phone(tenant):
        return
    notify_invoice_issued(
        tenant_name=tenant.name,
        tenant_phone=tenant.phone,
        invoice_number=invoice.invoice_number,
        amount=invoice.total_amount,
        currency=(lease.rent_currency or '').strip() if lease else '',
        due_date=invoice.due_date,
    )


def send_payment_received_sms(payment: Payment) -> None:
    tenant = payment.tenant
    org = payment.org if payment.org_id else (tenant.org if tenant else None)
    if not org_sms_enabled(org) or not _tenant_has_phone(tenant):
        return
    notify_payment_received(
        tenant_name=tenant.name,
        tenant_phone=tenant.phone,
        amount=payment.amount,
        payment_date=payment.payment_date,
        reference=payment.reference,
    )


def send_invoice_paid_sms(invoice: Invoice) -> None:
    lease = invoice.lease
    tenant = lease.tenant if lease else None
    org = invoice.org or (tenant.org if tenant else None)
    if not org_sms_enabled(org) or not _tenant_has_phone(tenant):
        return
    notify_invoice_paid(
        tenant_name=tenant.name,
        tenant_phone=tenant.phone,
        invoice_number=invoice.invoice_number,
    )


def send_job_order_update_sms(job_order: JobOrder) -> None:
    if not org_sms_enabled(job_order.org):
        return
    unit = job_order.unit
    if unit is None:
        return
    lease = (
        Lease.objects.filter(unit_id=unit.pk, status='active')
        .select_related('tenant', 'tenant__org', 'unit', 'unit__building')
        .first()
    )
    tenant = lease.tenant if lease else None
    if not _tenant_has_phone(tenant):
        return
    notify_job_order_update(
        tenant_phone=tenant.phone,
        unit_label=_unit_label(lease),
        job_title=job_order.title,
        job_status=job_order.status,
    )


def _unit_label(lease: Lease) -> str:
    unit = lease.unit
    if unit is None:
        return f'Lease #{lease.pk}'
    building_name = getattr(unit.building, 'name', '') if getattr(unit, 'building_id', None) else ''
    if building_name and unit.unit_number:
        return f'{building_name} - {unit.unit_number}'
    return building_name or unit.unit_number or f'Unit #{unit.pk}'


def _tenant_building_name(tenant: Tenant) -> str:
    lease = (
        Lease.objects.filter(tenant_id=tenant.pk)
        .select_related('unit', 'unit__building')
        .order_by('-id')
        .first()
    )
    if lease is None or lease.unit is None or lease.unit.building is None:
        return ''
    return (lease.unit.building.name or '').strip()

