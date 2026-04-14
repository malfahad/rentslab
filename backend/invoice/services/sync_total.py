"""Keep ``Invoice.total_amount`` aligned with line items."""

from __future__ import annotations

from decimal import Decimal

from django.db.models import Sum


def sync_invoice_total_from_line_items(invoice_id: int) -> None:
    from invoice.models import Invoice
    from invoice_line_item.models import InvoiceLineItem

    total = InvoiceLineItem.objects.filter(invoice_id=invoice_id).aggregate(s=Sum('amount'))['s']
    Invoice.objects.filter(pk=invoice_id).update(
        total_amount=total if total is not None else Decimal('0.00'),
    )
