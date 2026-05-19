from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import User


@receiver(post_save, sender=User)
def send_activation_email_on_create(_sender, instance, created, **_kwargs):
    if not created or instance.is_active:
        return

    link = f"{settings.FRONTEND_URL}/activate/{instance.activation_token}"

    try:
        send_mail(
            subject='Ativa a tua conta GEIA',
            message=f"Olá {instance.name},\n\nClica no link para ativar a tua conta:\n{link}\n\nEquipa GEIA",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.email],
        )
    except Exception:
        pass
