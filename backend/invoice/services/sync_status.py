"""Derive invoice ``status`` from payment allocations vs ``total_amount``."""

from __future__ import annotations

from decimal import Decimal

from django.db.models import Sum


def sync_invoice_status_from_allocations(invoice_id: int) -> None:
    """
    Set invoice status from allocated amounts:

    - No (or zero) allocations → ``unpaid``
    - Sum < total_amount → ``partial``
    - Sum >= total_amount → ``paid``

    Does not change invoices in ``void`` status.
    """
    from invoice.models import Invoice
    from payment_allocation.models import PaymentAllocation

    inv = Invoice.objects.filter(pk=invoice_id).only('id', 'status', 'total_amount').first()
    if inv is None:
        return
    if inv.status == 'void':
        return

    total = inv.total_amount if inv.total_amount is not None else Decimal('0')
    allocated = PaymentAllocation.objects.filter(invoice_id=invoice_id).aggregate(
        s=Sum('amount_applied'),
    )['s'] or Decimal('0')

    if allocated <= 0:
        new_status = 'unpaid'
    elif allocated >= total:
        new_status = 'paid'
    else:
        new_status = 'partial'

    if inv.status != new_status:
        Invoice.objects.filter(pk=invoice_id).update(status=new_status)
