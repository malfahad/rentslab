from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoice_line_item', '0002_schema_models_txt'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoicelineitem',
            name='billing_period_start',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='invoicelineitem',
            name='billing_period_end',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='invoicelineitem',
            name='line_kind',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Set for automated issuance; legacy rows may be blank.',
                max_length=16,
            ),
        ),
        migrations.AddIndex(
            model_name='invoicelineitem',
            index=models.Index(
                fields=['billing_period_start', 'billing_period_end'],
                name='invline_period_idx',
            ),
        ),
    ]
