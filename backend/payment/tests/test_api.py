from decimal import Decimal

from payment.models import Payment
from test_helpers import (
    auth_client_for_org,
    create_invoice,
    create_lease,
    create_payment,
    create_payment_allocation,
)
from testing_common import DRFTestCase


class PaymentAPITests(DRFTestCase):
    base = '/api/v1/payments/'

    def test_crud(self):
        lease = create_lease()
        org = lease.unit.building.org
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {
                'tenant': lease.tenant.pk,
                'lease': lease.pk,
                'amount': '300.00',
                'method': 'mobile_money',
                'reference': 'TX-1',
                'payment_date': '2025-09-01T10:00:00Z',
            },
        )
        assert created['org'] == org.pk
        pk = created['id']
        self.assert_patch_ok(f'{self.base}{pk}/', {'reference': 'TX-2'})

    def test_create_with_allocations(self):
        lease = create_lease()
        org = lease.unit.building.org
        inv = create_invoice(lease=lease, org=org, total_amount=Decimal('500.00'))
        auth_client_for_org(self.client, org)
        created = self.assert_create(
            self.base,
            {
                'tenant': lease.tenant.pk,
                'lease': lease.pk,
                'amount': '200.00',
                'method': 'bank',
                'reference': 'ALLOC-1',
                'payment_date': '2025-09-02T10:00:00Z',
                'allocations': [{'invoice': inv.pk, 'amount_applied': '200.00'}],
            },
        )
        assert created['org'] == org.pk
        from payment_allocation.models import PaymentAllocation

        rows = PaymentAllocation.objects.filter(payment_id=created['id'])
        assert rows.count() == 1
        assert rows.first().amount_applied == Decimal('200.00')

    def test_public_receipt_endpoint(self):
        lease = create_lease()
        org = lease.unit.building.org
        org.name = 'Acme Rentals'
        org.phone = '+256700000111'
        org.address_line1 = 'Kampala Road'
        org.city = 'Kampala'
        org.save(update_fields=['name', 'phone', 'address_line1', 'city'])
        payment = create_payment(
            org=org,
            tenant=lease.tenant,
            lease=lease,
            amount=Decimal('300.00'),
            reference='PMT-123',
        )
        invoice = create_invoice(lease=lease, org=org, invoice_number='INV-2026-001')
        create_payment_allocation(payment=payment, invoice=invoice, amount_applied=Decimal('300.00'))
        receipt_id = Payment.encode_public_receipt_id(payment.id)

        resp = self.client.get(f'/api/v1/payments/public-receipts/{receipt_id}/')
        assert resp.status_code == 200
        payload = resp.json()
        assert payload['payment_id'] == payment.id
        assert payload['receipt_id'] == receipt_id
        assert payload['title'] == 'Payment Receipt'
        assert payload['org']['name'] == 'Acme Rentals'
        assert payload['rows'][0]['item'] == 'INV-2026-001'

    def test_public_receipt_endpoint_rejects_invalid_token(self):
        resp = self.client.get('/api/v1/payments/public-receipts/not-a-valid-token/')
        assert resp.status_code == 404
