# Generated manually: link invoice lines to job orders for tenant recharge.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('job_order', '0003_alter_joborder_status_default'),
        ('invoice_line_item', '0003_invoice_lineitem_billing_periods'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoicelineitem',
            name='job_order',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='invoice_line_items',
                to='job_order.joborder',
            ),
        ),
        migrations.AddIndex(
            model_name='invoicelineitem',
            index=models.Index(fields=['job_order'], name='invline_job_order_idx'),
        ),
    ]
