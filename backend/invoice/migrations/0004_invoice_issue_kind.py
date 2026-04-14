from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoice', '0003_schema_models_txt'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='issue_kind',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Empty for legacy; "catch_up" for automated batch issuance.',
                max_length=16,
            ),
        ),
    ]
