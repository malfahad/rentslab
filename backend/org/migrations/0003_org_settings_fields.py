from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('org', '0002_schema_models_txt'),
    ]

    operations = [
        migrations.AddField(
            model_name='org',
            name='business_registration_number',
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name='org',
            name='tax_id',
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name='org',
            name='logo_url',
            field=models.CharField(blank=True, max_length=1024),
        ),
        migrations.AddField(
            model_name='org',
            name='tagline',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='org',
            name='timezone',
            field=models.CharField(default='Africa/Nairobi', max_length=64),
        ),
        migrations.AddField(
            model_name='org',
            name='language',
            field=models.CharField(default='en', max_length=16),
        ),
        migrations.AddField(
            model_name='org',
            name='locale',
            field=models.CharField(default='en-KE', max_length=32),
        ),
        migrations.AddField(
            model_name='org',
            name='default_currency',
            field=models.CharField(default='KES', max_length=3),
        ),
    ]
