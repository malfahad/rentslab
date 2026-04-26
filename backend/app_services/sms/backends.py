"""Pluggable SMS backends."""

from __future__ import annotations

import logging

from django.conf import settings

logger = logging.getLogger(__name__)


class BaseSmsBackend:
    def send_sms(self, *, to: str, message: str, sender_id: str | None = None) -> bool:
        raise NotImplementedError


class ConsoleSmsBackend(BaseSmsBackend):
    """Debug backend: logs outbound SMS payloads."""

    def send_sms(self, *, to: str, message: str, sender_id: str | None = None) -> bool:
        logger.info('SMS to=%s sender=%s message=%s', to, sender_id or '', message)
        return True


class AfricaTalkingSmsBackend(BaseSmsBackend):
    """Africa's Talking SMS backend via official Python SDK."""

    def send_sms(self, *, to: str, message: str, sender_id: str | None = None) -> bool:
        try:
            import africastalking
        except Exception:
            logger.exception('africastalking SDK is not installed or failed to import')
            return False

        api_key = (getattr(settings, 'SMS_AT_API_KEY', '') or '').strip()
        username = (getattr(settings, 'SMS_AT_USERNAME', 'sandbox') or '').strip()
        if not api_key:
            logger.warning('SMS backend configured without API credentials; skipping send')
            return False

        try:
            africastalking.initialize(username, api_key)
            sms = africastalking.SMS
            if sender_id:
                response = sms.send(message, [to], sender_id=sender_id)
            else:
                response = sms.send(message, [to])
            response = sms.send(message, [to], sender_id=sender_id or None)
        except Exception:
            logger.exception('Failed to send SMS via AfricaTalking SDK')
            return False

        sms_data = response.get('SMSMessageData') if isinstance(response, dict) else None
        recipients = (sms_data or {}).get('Recipients') or []
        logger.info(
            'SMS provider response message=%s recipients=%s raw=%s',
            (sms_data or {}).get('Message', ''),
            [
                {
                    'number': rec.get('number'),
                    'status': rec.get('status'),
                    'statusCode': rec.get('statusCode'),
                    'cost': rec.get('cost'),
                    'messageId': rec.get('messageId'),
                }
                for rec in recipients
                if isinstance(rec, dict)
            ],
            response,
        )
        recipients_ok = any(
            isinstance(rec, dict)
            and str(rec.get('status', '')).strip().lower() == 'success'
            and int(rec.get('statusCode', 0) or 0) in {100, 101, 102}
            for rec in recipients
        )
        if not recipients_ok:
            logger.error(
                'SMS provider returned no successful recipients message=%s',
                (sms_data or {}).get('Message', ''),
            )
            return False
        return True


def load_sms_backend() -> BaseSmsBackend:
    dotted = getattr(
        settings,
        'SMS_BACKEND',
        'app_services.sms.backends.ConsoleSmsBackend',
    )
    module_name, _, class_name = dotted.rpartition('.')
    if not module_name or not class_name:
        raise ValueError(f'Invalid SMS_BACKEND path: {dotted!r}')
    module = __import__(module_name, fromlist=[class_name])
    backend_cls = getattr(module, class_name)
    return backend_cls()

