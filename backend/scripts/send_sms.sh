#!/usr/bin/env bash
set -euo pipefail

# Send a plain text SMS through the configured Django SMS backend.
# Usage:
#   ./scripts/send_sms.sh "+256700000001" "Hello from RentSlab"
#   ./scripts/send_sms.sh "+256700000001" "Hello" "RentSlab"

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: $0 <phone> <message> [sender_id]"
  exit 1
fi

PHONE="$1"
MESSAGE="$2"
SENDER_ID="${3:-}"
SMS_LOG_LEVEL="${SMS_LOG_LEVEL:-INFO}"

python3 manage.py shell -c "
import logging
from django.conf import settings
from app_services.sms.backends import load_sms_backend

phone = '''${PHONE}'''.strip()
message = '''${MESSAGE}'''.strip()
sender = '''${SENDER_ID}'''.strip() 
log_level_name = '''${SMS_LOG_LEVEL}'''.strip().upper() or 'INFO'
log_level = getattr(logging, log_level_name, logging.INFO)

root_logger = logging.getLogger()
if not root_logger.handlers:
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s %(levelname)s [%(name)s] %(message)s',
    )
else:
    root_logger.setLevel(log_level)
    for handler in root_logger.handlers:
        handler.setLevel(log_level)

logging.getLogger('app_services.sms').setLevel(log_level)
logger = logging.getLogger('app_services.sms.script')

if not phone:
    raise SystemExit('Phone is required')
if not message:
    raise SystemExit('Message is required')

logger.info('Preparing SMS send to=%s sender=%s backend=%s', phone, sender, settings.SMS_BACKEND)
backend = load_sms_backend()
ok = backend.send_sms(to=phone, message=message[:480], sender_id=sender or None)
logger.info('SMS send dispatched to backend')
if not ok:
    raise SystemExit(f'SMS failed for {phone} via {settings.SMS_BACKEND}')
print(f'SMS sent to {phone} via {settings.SMS_BACKEND}')
"

