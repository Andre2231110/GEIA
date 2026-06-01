from django.db import migrations
from django.contrib.auth.hashers import make_password

def criar_admin(apps, schema_editor):
    User = apps.get_model('api', 'User')

    if not User.objects.filter(email='admin@geia.pt').exists():
        User.objects.create(
            name='Admin',
            email='admin@geia.pt',
            password=make_password('admin123'),
            role='admin',
            is_active=True,
        )

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_alter_class_course_alter_user_role'),
    ]

    operations = [
        migrations.RunPython(criar_admin),
    ]