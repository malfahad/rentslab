# Generated manually for job order workflow defaults.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('job_order', '0002_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='joborder',
            name='status',
            field=models.CharField(default='draft', max_length=32),
        ),
    ]
