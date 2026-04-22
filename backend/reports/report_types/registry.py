"""Maps URL slug → ``lookup`` callable for each report."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from . import (
    active_leases,
    ap_aging,
    ar_aging,
    audit_trail,
    cash_flow,
    income_statement,
    lease_expiry,
    lease_renewal,
    maintenance_requests_status,
    occupancy_vacancy,
    payment_collection_summary,
    property_performance,
    rent_roll,
    security_deposit,
    tenant_ledger,
    tenant_payment_history,
    tenant_turnover,
    unit_status,
    utility_usage,
    work_order_completion,
)

ReportLookup = Callable[..., dict[str, Any]]

REPORT_LOOKUPS: dict[str, ReportLookup] = {
    active_leases.SLUG: active_leases.lookup,
    ap_aging.SLUG: ap_aging.lookup,
    ar_aging.SLUG: ar_aging.lookup,
    audit_trail.SLUG: audit_trail.lookup,
    cash_flow.SLUG: cash_flow.lookup,
    income_statement.SLUG: income_statement.lookup,
    lease_expiry.SLUG: lease_expiry.lookup,
    lease_renewal.SLUG: lease_renewal.lookup,
    maintenance_requests_status.SLUG: maintenance_requests_status.lookup,
    occupancy_vacancy.SLUG: occupancy_vacancy.lookup,
    payment_collection_summary.SLUG: payment_collection_summary.lookup,
    property_performance.SLUG: property_performance.lookup,
    rent_roll.SLUG: rent_roll.lookup,
    security_deposit.SLUG: security_deposit.lookup,
    tenant_ledger.SLUG: tenant_ledger.lookup,
    tenant_payment_history.SLUG: tenant_payment_history.lookup,
    tenant_turnover.SLUG: tenant_turnover.lookup,
    unit_status.SLUG: unit_status.lookup,
    utility_usage.SLUG: utility_usage.lookup,
    work_order_completion.SLUG: work_order_completion.lookup,
}


def get_report_lookup(slug: str) -> ReportLookup | None:
    """Resolve a report helper by slug, or ``None`` if unknown."""
    return REPORT_LOOKUPS.get(slug)
