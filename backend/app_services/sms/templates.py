"""Structured SMS templates for tenant-facing notifications."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping


@dataclass(frozen=True)
class SmsTemplate:
    key: str
    body: str

    def render(self, context: Mapping[str, object]) -> str:
        return self.body.format(**context)


TENANT_WELCOME = SmsTemplate(
    key='tenant_welcome',
    body='Hi {tenant_name}, welcome to {building_name}. We will send your rent and account updates here.',
)
LEASE_ACTIVATED = SmsTemplate(
    key='lease_activated',
    body='Hi {tenant_name}, your lease for {unit_label} is now active. Rent: {amount} {currency} {billing_cycle}.',
)
LEASE_CLOSED = SmsTemplate(
    key='lease_closed',
    body='Hi {tenant_name}, your lease for {unit_label} is now marked as {lease_status}. Contact {org_name} for support.',
)
INVOICE_ISSUED = SmsTemplate(
    key='invoice_issued',
    body='Hi {tenant_name}, invoice {invoice_number} for {amount} {currency} is issued. Due date: {due_date}.',
)
PAYMENT_RECEIVED = SmsTemplate(
    key='payment_received',
    body='Payment received: {amount} from {tenant_name} on {payment_date}. Ref: {reference}. Thank you.',
)
INVOICE_PAID = SmsTemplate(
    key='invoice_paid',
    body='Great news {tenant_name}, invoice {invoice_number} is fully paid. Outstanding balance is now zero.',
)
JOB_ORDER_UPDATE = SmsTemplate(
    key='job_order_update',
    body='Maintenance update for {unit_label}: "{job_title}" is now {job_status}.',
)

