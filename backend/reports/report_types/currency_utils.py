from __future__ import annotations

from decimal import Decimal

from reports.fx import convert_amount


def normalized_currency(raw: str | None, fallback: str) -> str:
    code = (raw or '').strip().upper()
    return code or fallback


def convert_to_default(
    amount: Decimal,
    source_currency: str | None,
    default_currency: str,
) -> Decimal:
    src = normalized_currency(source_currency, default_currency)
    if src == default_currency:
        return amount
    return convert_amount(amount, src, default_currency)
