import uuid
from django.db import migrations, models


def populate_activation_tokens(apps, schema_editor):
    User = apps.get_model('api', 'User')
    for user in User.objects.filter(activation_token__isnull=True):
        user.activation_token = uuid.uuid4()
        user.save(update_fields=['activation_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        # 1. Add column nullable (no unique yet — existing rows get NULL first)
        migrations.AddField(
            model_name='user',
            name='activation_token',
            field=models.UUIDField(null=True, blank=True),
        ),
        # 2. Fill every existing row with a distinct UUID
        migrations.RunPython(populate_activation_tokens, migrations.RunPython.noop),
        # 3. Now make it non-null, unique, with a default for new rows
        migrations.AlterField(
            model_name='user',
            name='activation_token',
            field=models.UUIDField(default=uuid.uuid4, unique=True),
        ),
        # 4. Change is_active default to False for new users
        migrations.AlterField(
            model_name='user',
            name='is_active',
            field=models.BooleanField(default=False),
        ),
    ]
