from datetime import datetime, timezone as dt_timezone
from decimal import Decimal

from django.test import TestCase

from invoice.models import Invoice
from test_helpers import create_invoice, create_payment, create_payment_allocation


class InvoiceStatusFromAllocationsTests(TestCase):
    def test_partial_when_allocated_less_than_total(self):
        inv = create_invoice(total_amount=Decimal('1000.00'))
        pay = create_payment(
            org=inv.org,
            tenant=inv.lease.tenant,
            lease=inv.lease,
            amount=Decimal('1000.00'),
        )
        create_payment_allocation(
            payment=pay,
            invoice=inv,
            amount_applied=Decimal('250.00'),
        )
        inv.refresh_from_db()
        self.assertEqual(inv.status, 'partial')

    def test_paid_when_allocated_covers_total(self):
        inv = create_invoice(total_amount=Decimal('1000.00'))
        pay = create_payment(
            org=inv.org,
            tenant=inv.lease.tenant,
            lease=inv.lease,
            amount=Decimal('1000.00'),
        )
        create_payment_allocation(
            payment=pay,
            invoice=inv,
            amount_applied=Decimal('1000.00'),
        )
        inv.refresh_from_db()
        self.assertEqual(inv.status, 'paid')

    def test_unpaid_after_allocation_deleted(self):
        inv = create_invoice(total_amount=Decimal('1000.00'))
        pay = create_payment(
            org=inv.org,
            tenant=inv.lease.tenant,
            lease=inv.lease,
            amount=Decimal('1000.00'),
        )
        alloc = create_payment_allocation(
            payment=pay,
            invoice=inv,
            amount_applied=Decimal('500.00'),
        )
        inv.refresh_from_db()
        self.assertEqual(inv.status, 'partial')
        alloc.delete()
        inv.refresh_from_db()
        self.assertEqual(inv.status, 'unpaid')

    def test_void_invoice_not_overwritten(self):
        inv = create_invoice(total_amount=Decimal('1000.00'))
        Invoice.objects.filter(pk=inv.pk).update(status='void')
        inv.refresh_from_db()
        pay = create_payment(
            org=inv.org,
            tenant=inv.lease.tenant,
            lease=inv.lease,
            amount=Decimal('1000.00'),
        )
        create_payment_allocation(
            payment=pay,
            invoice=inv,
            amount_applied=Decimal('1000.00'),
        )
        inv.refresh_from_db()
        self.assertEqual(inv.status, 'void')

    def test_multiple_allocations_sum_to_paid(self):
        inv = create_invoice(total_amount=Decimal('1000.00'))
        pay1 = create_payment(
            org=inv.org,
            tenant=inv.lease.tenant,
            lease=inv.lease,
            amount=Decimal('600.00'),
            reference='p1',
        )
        pay2 = create_payment(
            org=inv.org,
            tenant=inv.lease.tenant,
            lease=inv.lease,
            amount=Decimal('500.00'),
            reference='p2',
            payment_date=datetime(2025, 2, 6, 12, 0, 0, tzinfo=dt_timezone.utc),
        )
        create_payment_allocation(
            payment=pay1,
            invoice=inv,
            amount_applied=Decimal('400.00'),
        )
        inv.refresh_from_db()
        self.assertEqual(inv.status, 'partial')
        create_payment_allocation(
            payment=pay2,
            invoice=inv,
            amount_applied=Decimal('600.00'),
        )
        inv.refresh_from_db()
        self.assertEqual(inv.status, 'paid')
