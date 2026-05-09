from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings
from django.core.mail import EmailMultiAlternatives


class CustomAccountAdapter(DefaultAccountAdapter):
    def send_mail(self, _template_prefix, email_address, context):
        uid = context.get("uid")
        token = context.get("token")

        reset_url = f"http://localhost:3000/password-reset-confirm/{uid}/{token}/"

        subject = "[BookNest] Reset your password"
        user = context.get("user")
        recipient_name = getattr(user, "name", "") or "Reader"
        body = (
            f"Hello {recipient_name},\n\n"
            f"We received a request to reset your password on BookNest.\n\n"
            f"Reset your password here: {reset_url}\n\n"
            f"If you didn't request this, please ignore this email.\n\n"
            f"— BookNest Team"
        )

        msg = EmailMultiAlternatives(subject, body, settings.DEFAULT_FROM_EMAIL, [email_address])
        msg.send()
