from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .models import User


def _build_activation_email(user):
    link = f"{settings.FRONTEND_URL}/activate/{user.activation_token}"

    subject = 'Ativa a tua conta GEIA'

    text_body = (
        f"Olá {user.name},\n\n"
        f"A tua conta na plataforma GEIA foi criada com sucesso.\n"
        f"Para começares a usar a plataforma, precisas de ativar a tua conta clicando no link abaixo:\n\n"
        f"{link}\n\n"
        f"Este link é de uso único e expira assim que a conta for ativada.\n\n"
        f"Se não pediste o acesso a esta plataforma, podes ignorar este email.\n\n"
        f"Cumprimentos,\n"
        f"Equipa GEIA"
    )

    html_body = f"""
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:32px 40px 24px;text-align:center;border-bottom:1px solid #334155;">
            <span style="font-size:26px;font-weight:700;color:#818cf8;letter-spacing:-0.5px;">GEIA</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 32px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#f1f5f9;">
              Olá, {user.name} 👋
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.7;">
              A tua conta na plataforma <strong style="color:#e2e8f0;">GEIA</strong> foi criada com sucesso.
              Para começares a usar a plataforma, clica no botão abaixo para ativar a tua conta.
            </p>

            <!-- Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#4f46e5;border-radius:10px;">
                  <a href="{link}"
                     style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                            color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                    Ativar conta
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 6px;font-size:13px;color:#64748b;line-height:1.6;">
              Se o botão não funcionar, copia e cola este link no teu browser:
            </p>
            <p style="margin:0;font-size:12px;word-break:break-all;">
              <a href="{link}" style="color:#818cf8;text-decoration:none;">{link}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
            <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
              Se não pediste acesso a esta plataforma, podes ignorar este email em segurança.<br>
              &copy; 2026 GEIA &mdash; Todos os direitos reservados.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    msg.attach_alternative(html_body, "text/html")
    return msg


@receiver(post_save, sender=User)
def send_activation_email_on_create(sender, instance, created, **kwargs):
    if created and not instance.is_active:
        try:
            _build_activation_email(instance).send()
        except Exception:
            pass
