from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_studentdoubt_reply'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentDoubtMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('doubt', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='thread_messages', to='api.studentdoubt')),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.user')),
            ],
        ),
    ]
