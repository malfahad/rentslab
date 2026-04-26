from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('org', '0004_org_default_currency_and_locale'),
    ]

    operations = [
        migrations.AddField(
            model_name='org',
            name='sms_notifications_enabled',
            field=models.BooleanField(default=True),
        ),
    ]

