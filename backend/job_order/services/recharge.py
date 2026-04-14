"""Tenant recharge: job-related invoice line items."""

from __future__ import annotations

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Max

from invoice.models import Invoice
from invoice.services.sync_total import sync_invoice_total_from_line_items
from invoice_line_item.models import InvoiceLineItem

from ..models import JobOrder


def add_job_recharge_line(
    job_order: JobOrder,
    invoice: Invoice,
    amount: Decimal,
    description: str,
) -> InvoiceLineItem:
    """
    Append a ``job_recharge`` line to ``invoice`` and refresh the invoice total.

    Validates org alignment and that the invoice lease matches the job site:
    same unit when the job is unit-scoped; otherwise same building.
    """
    if job_order.org_id != invoice.org_id:
        raise ValidationError('Invoice organization must match the job order.')
    if job_order.org_id != invoice.lease.unit.building.org_id:
        raise ValidationError('Lease is not in the same organization as the job order.')
    lease_unit = invoice.lease.unit
    if job_order.unit_id is not None:
        if lease_unit.pk != job_order.unit_id:
            raise ValidationError('Invoice lease unit must match the job order unit.')
    else:
        if lease_unit.building_id != job_order.building_id:
            raise ValidationError('Invoice lease must be for the same building as the job order.')

    with transaction.atomic():
        max_ln = InvoiceLineItem.objects.filter(invoice_id=invoice.pk).aggregate(m=Max('line_number'))['m'] or 0
        line = InvoiceLineItem.objects.create(
            invoice=invoice,
            line_number=max_ln + 1,
            description=description,
            amount=amount,
            line_kind=InvoiceLineItem.LINE_KIND_JOB_RECHARGE,
            job_order=job_order,
        )
        sync_invoice_total_from_line_items(invoice.pk)
    return line
