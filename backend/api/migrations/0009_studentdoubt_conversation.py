from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_studentdoubt'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentdoubt',
            name='conversation',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='doubts',
                to='api.conversation',
            ),
        ),
        migrations.RenameField(
            model_name='studentdoubt',
            old_name='message',
            new_name='description',
        ),
    ]
