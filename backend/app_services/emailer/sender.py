"""Send transactional emails using Django templates under ``emailer/``."""

from __future__ import annotations

from urllib.parse import urlencode, urljoin

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone


def _site_context() -> dict[str, str]:
    return {
        'site_name': getattr(settings, 'SITE_NAME', 'RentSlab'),
        'support_email': getattr(settings, 'SUPPORT_EMAIL', settings.DEFAULT_FROM_EMAIL),
    }


def _frontend_link(path: str, **query: str) -> str | None:
    root = getattr(settings, 'FRONTEND_URL', '').strip()
    if not root:
        return None
    base = urljoin(root.rstrip('/') + '/', path.lstrip('/'))
    if query:
        return f'{base}?{urlencode(query)}'
    return base


def _send_html_email(
    *,
    subject: str,
    to: list[str],
    text_template: str,
    html_template: str,
    context: dict,
) -> None:
    text_body = render_to_string(text_template, context)
    html_body = render_to_string(html_template, context)
    msg = EmailMultiAlternatives(
        subject,
        text_body,
        settings.DEFAULT_FROM_EMAIL,
        to,
    )
    msg.attach_alternative(html_body, 'text/html')
    msg.send(fail_silently=True)


def send_activate_account_email(
    to_email: str,
    *,
    uid: str,
    token: str,
) -> None:
    ctx = {
        **_site_context(),
        'uid': uid,
        'token': token,
        'activation_url': _frontend_link('activate-account', uid=uid, token=token),
    }
    _send_html_email(
        subject=f"Activate your {ctx['site_name']} account",
        to=[to_email],
        text_template='emailer/activate_account.txt',
        html_template='emailer/activate_account.html',
        context=ctx,
    )


def send_password_reset_email(
    to_email: str,
    *,
    uid: str,
    token: str,
) -> None:
    ctx = {
        **_site_context(),
        'uid': uid,
        'token': token,
        'reset_url': _frontend_link('reset-password', uid=uid, token=token),
    }
    _send_html_email(
        subject=f"Reset your {ctx['site_name']} password",
        to=[to_email],
        text_template='emailer/reset_password.txt',
        html_template='emailer/reset_password.html',
        context=ctx,
    )


def send_password_changed_email(
    to_email: str,
    *,
    changed_at_display: str | None = None,
) -> None:
    if changed_at_display is None:
        changed_at_display = timezone.localtime(timezone.now()).strftime('%Y-%m-%d %H:%M %Z')
    ctx = {**_site_context(), 'changed_at_display': changed_at_display}
    _send_html_email(
        subject=f"Your {ctx['site_name']} password was changed",
        to=[to_email],
        text_template='emailer/password_changed.txt',
        html_template='emailer/password_changed.html',
        context=ctx,
    )


def send_welcome_email(
    to_email: str,
    *,
    display_name: str | None = None,
) -> None:
    ctx = {**_site_context(), 'display_name': display_name or ''}
    _send_html_email(
        subject=f"Welcome to {ctx['site_name']}",
        to=[to_email],
        text_template='emailer/welcome.txt',
        html_template='emailer/welcome.html',
        context=ctx,
    )


def send_invitation_email(
    to_email: str,
    *,
    inviter_name: str,
    org_name: str,
    invitation_url: str | None = None,
) -> None:
    ctx = {
        **_site_context(),
        'inviter_name': inviter_name,
        'org_name': org_name,
        'invitation_url': invitation_url,
    }
    _send_html_email(
        subject=f"{inviter_name} invited you to {org_name} on {ctx['site_name']}",
        to=[to_email],
        text_template='emailer/invitation.txt',
        html_template='emailer/invitation.html',
        context=ctx,
    )


def send_email_address_changed_notice(
    to_email: str,
    *,
    new_email: str,
) -> None:
    ctx = {**_site_context(), 'new_email': new_email}
    _send_html_email(
        subject=f"Your {ctx['site_name']} account email is being changed",
        to=[to_email],
        text_template='emailer/email_address_changed.txt',
        html_template='emailer/email_address_changed.html',
        context=ctx,
    )
