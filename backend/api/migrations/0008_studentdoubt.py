from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_userconversation_shared_by'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentDoubt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField()),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('classroom', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='doubts', to='api.class')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='doubts_sent', to='api.user')),
            ],
        ),
    ]
