import json
import logging
import urllib.request
import urllib.error
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings

logger = logging.getLogger(__name__)


class BrevoEmailBackend(BaseEmailBackend):
    """
    Django email backend that sends transactional emails via the Brevo (Sendinblue)
    v3 REST API (https://api.brevo.com/v3/smtp/email).
    
    Compatible with Brevo API v3 keys (starting with 'xkeysib-'), bypassing SMTP 535
    authentication mismatches and ISP port-587 blocks.
    """

    def __init__(self, api_key=None, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = (
            api_key
            or getattr(settings, "EMAIL_HOST_PASSWORD", "")
            or getattr(settings, "BREVO_API_KEY", "")
        )

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        if not self.api_key:
            logger.error("BrevoEmailBackend: No API key configured.")
            if not self.fail_silently:
                raise ValueError("Brevo API key is missing. Set EMAIL_HOST_PASSWORD in .env.")
            return 0

        sent_count = 0
        url = "https://api.brevo.com/v3/smtp/email"

        for message in email_messages:
            try:
                html_content = None
                if hasattr(message, "alternatives"):
                    for alt_content, alt_mimetype in message.alternatives:
                        if alt_mimetype == "text/html":
                            html_content = alt_content
                            break

                from_email = message.from_email or getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@routex.org")
                from_name = "RouteX"
                if "<" in from_email and ">" in from_email:
                    parts = from_email.split("<")
                    from_name = parts[0].strip() or "RouteX"
                    from_email = parts[1].replace(">", "").strip()

                payload = {
                    "sender": {"name": from_name, "email": from_email},
                    "to": [{"email": to_addr.strip()} for to_addr in message.to],
                    "subject": message.subject,
                }

                if html_content:
                    payload["htmlContent"] = html_content
                if message.body:
                    payload["textContent"] = message.body

                data = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(
                    url,
                    data=data,
                    headers={
                        "api-key": self.api_key,
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    method="POST",
                )

                timeout = getattr(settings, "EMAIL_TIMEOUT", 30) or 30
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    if 200 <= response.status < 300:
                        sent_count += 1
                        logger.info("Successfully sent email via Brevo API to %s", message.to)
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                logger.error("Brevo API HTTP %d error: %s", e.code, err_body)
                if not self.fail_silently:
                    raise
            except Exception as e:
                logger.error("Failed to send message via Brevo API: %s", e)
                if not self.fail_silently:
                    raise

        return sent_count
