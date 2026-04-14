from django.db import migrations


def forwards(apps, schema_editor):
    UserRole = apps.get_model('user_role', 'UserRole')
    RoleDefinition = apps.get_model('access', 'RoleDefinition')
    for ur in UserRole.objects.all().iterator():
        if not ur.role_definition_id:
            continue
        rd = RoleDefinition.objects.filter(pk=ur.role_definition_id).first()
        if rd and ur.role != rd.key:
            UserRole.objects.filter(pk=ur.pk).update(role=rd.key)


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('user_role', '0004_schema_models_txt'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
