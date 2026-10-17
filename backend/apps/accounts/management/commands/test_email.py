"""
Management command to test email configuration and dispatch.
Usage:
    python manage.py test_email
    python manage.py test_email user@example.com
"""
import sys
from django.core.management.base import BaseCommand
from django.core.mail import EmailMultiAlternatives
from django.conf import settings


class Command(BaseCommand):
    help = "Tests sending an email using the active settings.py and .env configuration."

    def add_arguments(self, parser):
        parser.add_argument(
            "recipient",
            nargs="?",
            type=str,
            default=getattr(settings, "TEST_RESET_EMAIL", "") or getattr(settings, "EMAIL_HOST_USER", ""),
            help="Recipient email address (defaults to TEST_RESET_EMAIL from .env)",
        )
        parser.add_argument(
            "--raw",
            action="store_true",
            help="Send raw text test email instead of branded password reset template.",
        )

    def handle(self, *args, **options):
        recipient = options.get("recipient")
        if not recipient:
            self.stderr.write(
                self.style.ERROR(
                    "No recipient specified and TEST_RESET_EMAIL is not configured in .env."
                )
            )
            sys.exit(1)

        self.stdout.write(self.style.NOTICE("Testing RouteX Email Configuration..."))
        self.stdout.write(f"  EMAIL_BACKEND:       {settings.EMAIL_BACKEND}")
        self.stdout.write(f"  EMAIL_HOST:          {settings.EMAIL_HOST}")
        self.stdout.write(f"  EMAIL_PORT:          {settings.EMAIL_PORT}")
        self.stdout.write(f"  EMAIL_USE_TLS:       {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"  EMAIL_HOST_USER:     {settings.EMAIL_HOST_USER}")
        self.stdout.write(f"  DEFAULT_FROM_EMAIL:  {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"  Sending to:          {recipient}")

        if options.get("raw"):
            subject = "RouteX - Email Configuration Test"
            text_content = (
                f"Hello,\n\n"
                f"This is a test email sent from RouteX backend to verify email configuration.\n"
                f"Backend: {settings.EMAIL_BACKEND}\n"
                f"Host: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}\n"
            )
            html_content = (
                f"<div style='font-family: sans-serif; padding: 20px; color: #142B3B;'>"
                f"<h2 style='color: #087F8C;'>RouteX Test Email</h2>"
                f"<p>This is a test email confirming that your email configuration is operational.</p>"
                f"<ul>"
                f"<li><strong>Backend:</strong> {settings.EMAIL_BACKEND}</li>"
                f"<li><strong>Host:</strong> {settings.EMAIL_HOST}:{settings.EMAIL_PORT}</li>"
                f"<li><strong>From:</strong> {settings.DEFAULT_FROM_EMAIL}</li>"
                f"</ul>"
                f"</div>"
            )
        else:
            import os
            import base64
            from email.mime.image import MIMEImage
            from django.template.loader import render_to_string

            subject = "Reset your RouteX password (Design Test)"
            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")

            logo_path = os.path.join(settings.BASE_DIR, "static", "routex-email-logo.png")
            logo_bytes = b""
            logo_b64 = ""
            if os.path.exists(logo_path):
                try:
                    with open(logo_path, "rb") as f:
                        logo_bytes = f.read()
                        logo_b64 = base64.b64encode(logo_bytes).decode("ascii")
                except Exception:
                    pass

            context = {
                "user_name": "Valued Commuter",
                "user_email": recipient,
                "reset_url": f"{frontend_url}/reset-password?uid=TEST&token=sample-token-123",
                "logo_cid": "routex_logo" if logo_bytes else "",
                "logo_base64": logo_b64,
                "logo_url": f"{frontend_url}/routex-logo.png",
            }
            html_content = render_to_string("emails/password_reset.html", context)
            text_content = render_to_string("emails/password_reset.txt", context)

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient],
            )
            msg.attach_alternative(html_content, "text/html")
            if not options.get("raw") and logo_bytes:
                mime_img = MIMEImage(logo_bytes, _subtype="png")
                mime_img.add_header("Content-ID", "<routex_logo>")
                mime_img.add_header("Content-Disposition", "inline", filename="routex-logo.png")
                msg.attach(mime_img)
            sent_count = msg.send(fail_silently=False)
            if sent_count > 0:
                self.stdout.write(self.style.SUCCESS(f"Successfully sent test email to {recipient} (count: {sent_count})!"))
            else:
                self.stdout.write(self.style.WARNING("Email send returned 0 sent messages."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed to send email: {e}"))
