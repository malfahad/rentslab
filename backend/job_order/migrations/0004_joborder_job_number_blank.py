# Allow omitting job_number on create (assigned by API); validated in model clean.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('job_order', '0003_alter_joborder_status_default'),
    ]

    operations = [
        migrations.AlterField(
            model_name='joborder',
            name='job_number',
            field=models.CharField(blank=True, max_length=64),
        ),
    ]
