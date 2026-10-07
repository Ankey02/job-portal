"""Email notifications.

Emails are sent after the response (FastAPI BackgroundTasks), so the recruiter's click
is not slowed down. Without SMTP settings in .env the email is printed in the server
terminal, which is enough for local development.
"""
import logging
import smtplib
from email.message import EmailMessage

from .config import settings

logger = logging.getLogger("uvicorn.error")

STATUS_MESSAGES = {
    "applied": "Your application has been moved back to review.",
    "shortlisted": "Good news: you have been shortlisted. The recruiter may contact you for the next round.",
    "rejected": "The recruiter has decided not to move forward with your application this time.",
    "hired": "Congratulations! You have been selected for this role.",
}


def send_email(to: str, subject: str, body: str) -> None:
    if not settings.smtp_host:
        logger.info("EMAIL (not sent, SMTP is not configured)\nTo: %s\nSubject: %s\n\n%s", to, subject, body)
        return

    message = EmailMessage()
    message["From"] = settings.email_from or settings.smtp_user
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.starttls()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(message)
    except (smtplib.SMTPException, OSError):
        # A failed email must never break the app; log it and move on
        logger.exception("Could not send email to %s", to)


def send_status_email(to: str, name: str, job_title: str, company: str, status: str) -> None:
    subject = f"Update on your application: {job_title} at {company}"
    body = (
        f"Hi {name},\n\n"
        f"Your application for {job_title} at {company} is now: {status.upper()}.\n\n"
        f"{STATUS_MESSAGES.get(status, '')}\n\n"
        "Log in to your dashboard to see all your applications.\n"
    )
    send_email(to, subject, body)
