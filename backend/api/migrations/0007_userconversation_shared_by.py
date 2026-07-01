import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_merge'),
    ]

    operations = [
        migrations.AddField(
            model_name='userconversation',
            name='shared_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='shared_by_me',
                to='api.user',
            ),
        ),
    ]
