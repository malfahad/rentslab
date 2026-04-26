from __future__ import annotations

from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase

from invoice.models import Invoice
from job_order.models import JobOrder
from lease.models import Lease
from payment_allocation.models import PaymentAllocation
from test_helpers import (
    create_building,
    create_invoice,
    create_job_order,
    create_lease,
    create_org,
    create_payment,
    create_tenant,
    create_unit,
)


class SmsNotificationScenariosTests(TestCase):
    @patch('app_services.sms.backends.ConsoleSmsBackend.send_sms')
    def test_tenant_onboarding_triggers_sms(self, send_sms):
        org = create_org(name='Acme PM')
        create_tenant(org=org, name='Alice Tenant', phone='+256700111111')
        self.assertEqual(send_sms.call_count, 1)

    @patch('app_services.sms.backends.ConsoleSmsBackend.send_sms')
    def test_invoice_creation_triggers_sms(self, send_sms):
        org = create_org(name='Acme PM')
        tenant = create_tenant(org=org, name='Alice Tenant', phone='+256700111111')
        unit = create_unit(building=create_building(org=org))
        lease = create_lease(unit=unit, tenant=tenant, rent_currency='UGX')
        create_invoice(
            lease=lease,
            org=org,
            invoice_number='INV-1001',
            total_amount=Decimal('250000.00'),
            due_date=date(2026, 1, 30),
        )
        self.assertEqual(send_sms.call_count, 3)

    @patch('app_services.sms.backends.ConsoleSmsBackend.send_sms')
    def test_payment_creation_triggers_sms(self, send_sms):
        org = create_org(name='Acme PM')
        tenant = create_tenant(org=org, name='Alice Tenant', phone='+256700111111')
        create_payment(org=org, tenant=tenant, amount=Decimal('100000.00'), reference='MOMO-1')
        self.assertEqual(send_sms.call_count, 2)

    @patch('app_services.sms.backends.ConsoleSmsBackend.send_sms')
    def test_invoice_paid_transition_triggers_sms(self, send_sms):
        org = create_org(name='Acme PM')
        tenant = create_tenant(org=org, name='Alice Tenant', phone='+256700111111')
        unit = create_unit(building=create_building(org=org))
        lease = create_lease(unit=unit, tenant=tenant, rent_currency='UGX')
        invoice = create_invoice(
            lease=lease,
            org=org,
            invoice_number='INV-1002',
            total_amount=Decimal('100000.00'),
        )
        payment = create_payment(org=org, tenant=tenant, lease=lease, amount=Decimal('100000.00'))
        before = send_sms.call_count
        PaymentAllocation.objects.create(
            payment=payment,
            invoice=invoice,
            amount_applied=Decimal('100000.00'),
        )
        self.assertGreater(send_sms.call_count, before)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, 'paid')

    @patch('app_services.sms.backends.ConsoleSmsBackend.send_sms')
    def test_job_order_status_update_triggers_sms(self, send_sms):
        org = create_org(name='Acme PM')
        tenant = create_tenant(org=org, name='Alice Tenant', phone='+256700111111')
        building = create_building(org=org)
        unit = create_unit(building=building)
        create_lease(unit=unit, tenant=tenant)
        job = create_job_order(org=org, building=building, unit=unit, status='draft')
        before = send_sms.call_count
        job.status = 'open'
        job.save(update_fields=['status', 'updated_at'])
        self.assertGreater(send_sms.call_count, before)

    @patch('app_services.sms.backends.ConsoleSmsBackend.send_sms')
    def test_org_level_sms_flag_disables_notifications(self, send_sms):
        org = create_org(name='Muted PM', sms_notifications_enabled=False)
        tenant = create_tenant(org=org, name='Bob Tenant', phone='+256700222222')
        unit = create_unit(building=create_building(org=org))
        lease = create_lease(unit=unit, tenant=tenant)
        create_payment(org=org, tenant=tenant, lease=lease, amount=Decimal('50000.00'))
        self.assertEqual(send_sms.call_count, 0)

    @patch('app_services.sms.backends.ConsoleSmsBackend.send_sms')
    def test_lease_closed_transition_triggers_sms(self, send_sms):
        org = create_org(name='Acme PM')
        tenant = create_tenant(org=org, name='Alice Tenant', phone='+256700111111')
        unit = create_unit(building=create_building(org=org))
        lease = create_lease(unit=unit, tenant=tenant, status='active')
        before = send_sms.call_count
        lease.status = 'terminated'
        lease.save(update_fields=['status', 'updated_at'])
        self.assertGreater(send_sms.call_count, before)
        lease.refresh_from_db()
        self.assertEqual(lease.status, Lease.objects.get(pk=lease.pk).status)

