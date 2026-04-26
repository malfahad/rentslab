"""Tenant SMS sender using structured templates."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from django.conf import settings

from .backends import load_sms_backend
from .templates import (
    INVOICE_ISSUED,
    INVOICE_PAID,
    JOB_ORDER_UPDATE,
    LEASE_ACTIVATED,
    LEASE_CLOSED,
    PAYMENT_RECEIVED,
    TENANT_WELCOME,
)


def _format_money(value: Decimal | int | float | str) -> str:
    return f'{Decimal(str(value)):.2f}'


def _safe_phone(phone: str | None) -> str:
    return (phone or '').strip()


def notify_tenant_welcome(*, tenant_name: str, building_name: str, tenant_phone: str) -> None:
    _send_template(
        phone=tenant_phone,
        template=TENANT_WELCOME,
        context={'tenant_name': tenant_name, 'building_name': building_name},
    )


def notify_lease_activated(
    *,
    tenant_name: str,
    tenant_phone: str,
    unit_label: str,
    amount: Decimal | int | float | str,
    currency: str,
    billing_cycle: str,
) -> None:
    _send_template(
        phone=tenant_phone,
        template=LEASE_ACTIVATED,
        context={
            'tenant_name': tenant_name,
            'unit_label': unit_label,
            'amount': _format_money(amount),
            'currency': currency or 'N/A',
            'billing_cycle': billing_cycle or 'month',
        },
    )


def notify_lease_closed(
    *,
    tenant_name: str,
    tenant_phone: str,
    unit_label: str,
    lease_status: str,
    org_name: str,
) -> None:
    _send_template(
        phone=tenant_phone,
        template=LEASE_CLOSED,
        context={
            'tenant_name': tenant_name,
            'unit_label': unit_label,
            'lease_status': lease_status,
            'org_name': org_name,
        },
    )


def notify_invoice_issued(
    *,
    tenant_name: str,
    tenant_phone: str,
    invoice_number: str,
    amount: Decimal | int | float | str,
    currency: str,
    due_date: date | datetime | str,
) -> None:
    due_display = due_date.isoformat() if hasattr(due_date, 'isoformat') else str(due_date)
    _send_template(
        phone=tenant_phone,
        template=INVOICE_ISSUED,
        context={
            'tenant_name': tenant_name,
            'invoice_number': invoice_number or 'pending-number',
            'amount': _format_money(amount),
            'currency': currency or 'N/A',
            'due_date': due_display,
        },
    )


def notify_payment_received(
    *,
    tenant_name: str,
    tenant_phone: str,
    amount: Decimal | int | float | str,
    payment_date: date | datetime | str,
    reference: str,
) -> None:
    payment_display = payment_date.isoformat() if hasattr(payment_date, 'isoformat') else str(payment_date)
    _send_template(
        phone=tenant_phone,
        template=PAYMENT_RECEIVED,
        context={
            'tenant_name': tenant_name,
            'amount': _format_money(amount),
            'payment_date': payment_display,
            'reference': reference or '-',
        },
    )


def notify_invoice_paid(*, tenant_name: str, tenant_phone: str, invoice_number: str) -> None:
    _send_template(
        phone=tenant_phone,
        template=INVOICE_PAID,
        context={'tenant_name': tenant_name, 'invoice_number': invoice_number or 'pending-number'},
    )


def notify_job_order_update(
    *,
    tenant_phone: str,
    unit_label: str,
    job_title: str,
    job_status: str,
) -> None:
    _send_template(
        phone=tenant_phone,
        template=JOB_ORDER_UPDATE,
        context={
            'unit_label': unit_label,
            'job_title': job_title,
            'job_status': job_status,
        },
    )


def _send_template(*, phone: str, template, context: dict[str, object]) -> None:
    target = _safe_phone(phone)
    if not target:
        return
    backend = load_sms_backend()
    # sender_id = (getattr(settings, 'SMS_DEFAULT_SENDER', getattr(settings, 'SITE_NAME', 'RentSlab')) or '').strip()
    sender_id = None
    message = template.render(context)
    backend.send_sms(to=target, message=message[:480], sender_id=sender_id)

