from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('org', '0003_org_settings_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='org',
            name='default_currency',
            field=models.CharField(default='UGX', max_length=3),
        ),
        migrations.AlterField(
            model_name='org',
            name='locale',
            field=models.CharField(default='en-US', max_length=32),
        ),
    ]
