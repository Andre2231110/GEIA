from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_studentdoubt_conversation'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentdoubt',
            name='teacher_reply',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='studentdoubt',
            name='replied_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
