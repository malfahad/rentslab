from decimal import Decimal

from test_helpers import auth_client_for_org, create_invoice, create_lease
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
