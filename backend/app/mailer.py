import logging
import smtplib
from email.message import EmailMessage

from app import config

logger = logging.getLogger("app.mailer")


def send_email(to: str, subject: str, body: str) -> None:
  """Wysyła e-mail przez SMTP; bez skonfigurowanego SMTP (tryb deweloperski) wypisuje treść do logów."""
  if not config.SMTP_HOST:
    logger.info("e-mail_dev do=%s temat=%s\n%s", to, subject, body)
    return

  message = EmailMessage()
  message["From"] = config.SMTP_FROM
  message["To"] = to
  message["Subject"] = subject
  message.set_content(body)
  try:
    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=10) as smtp:
      smtp.starttls()
      if config.SMTP_USER:
        smtp.login(config.SMTP_USER, config.SMTP_PASSWORD)
      smtp.send_message(message)
    logger.info("e-mail_wyslany do=%s temat=%s", to, subject)
  except (smtplib.SMTPException, OSError):
    logger.exception("e-mail_blad do=%s temat=%s", to, subject)
