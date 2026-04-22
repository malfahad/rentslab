"""FX conversion helpers with simple 24h disk cache."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import json
from pathlib import Path
from typing import Any
from urllib.request import urlopen

from django.conf import settings

ALLOWED_REPORT_CURRENCIES = {'KES', 'UGX', 'TZS', 'USD'}
CACHE_TTL = timedelta(hours=24)
CACHE_FILE = Path(settings.BASE_DIR) / 'var' / 'fx_rates_cache.json'


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _load_cache() -> dict[str, Any]:
    if not CACHE_FILE.exists():
        return {}
    try:
        return json.loads(CACHE_FILE.read_text())
    except Exception:
        return {}


def _save_cache(cache: dict[str, Any]) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache))


def _cache_key(base: str, target: str) -> str:
    return f'{base.upper()}->{target.upper()}'


def _is_fresh(ts: str | None) -> bool:
    if not ts:
        return False
    try:
        parsed = datetime.fromisoformat(ts.replace('Z', '+00:00'))
    except ValueError:
        return False
    return (_utc_now() - parsed) <= CACHE_TTL


def get_mid_rate(base: str, target: str) -> Decimal:
    base = (base or '').upper().strip()
    target = (target or '').upper().strip()
    if not base or not target:
        return Decimal('1')
    if base == target:
        return Decimal('1')

    cache = _load_cache()
    key = _cache_key(base, target)
    existing = cache.get(key) if isinstance(cache, dict) else None
    if isinstance(existing, dict) and _is_fresh(existing.get('timestamp')):
        return Decimal(str(existing.get('mid', '1')))

    url = f'https://hexarate.paikama.co/api/rates/{base}/{target}/latest'
    try:
        with urlopen(url, timeout=8) as response:  # noqa: S310
            payload = json.loads(response.read().decode('utf-8'))
        data = payload.get('data') if isinstance(payload, dict) else None
        mid = Decimal(str((data or {}).get('mid', '1')))
        timestamp = (data or {}).get('timestamp') or _utc_now().isoformat()
        cache[key] = {'mid': str(mid), 'timestamp': timestamp}
        _save_cache(cache)
        return mid
    except Exception:
        # Fall back to stale cached rate when network is unavailable.
        if isinstance(existing, dict) and existing.get('mid') is not None:
            return Decimal(str(existing.get('mid')))
        return Decimal('1')


def convert_amount(amount: Decimal, source_currency: str, target_currency: str) -> Decimal:
    rate = get_mid_rate(source_currency, target_currency)
    return amount * rate
