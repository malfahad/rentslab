"""Limits for automated invoice issuance and catch-up runs."""

# Maximum billing periods walked per lease in a single issuance run (missed cycles
# consolidated into one invoice with one line per period). Prevents unbounded work
# and oversized invoices when backfilling long history.
MAX_ISSUANCE_PERIODS_PER_LEASE = 100

# Days after issue_date for generated invoices (header due_date).
DEFAULT_INVOICE_DUE_DAYS = 14
