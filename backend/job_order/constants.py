"""Job order workflow: canonical statuses and allowed transitions."""

from __future__ import annotations

class JobOrderStatus:
    DRAFT = 'draft'
    OPEN = 'open'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

    CHOICES = [
        (DRAFT, 'draft'),
        (OPEN, 'open'),
        (IN_PROGRESS, 'in_progress'),
        (COMPLETED, 'completed'),
        (CANCELLED, 'cancelled'),
    ]


# Valid status strings
CANONICAL_STATUSES = frozenset(x[0] for x in JobOrderStatus.CHOICES)

# allowed_transitions[from_status] = {to_status, ...}
ALLOWED_TRANSITIONS = {
    JobOrderStatus.DRAFT: frozenset({JobOrderStatus.OPEN, JobOrderStatus.CANCELLED}),
    JobOrderStatus.OPEN: frozenset(
        {JobOrderStatus.IN_PROGRESS, JobOrderStatus.COMPLETED, JobOrderStatus.CANCELLED}
    ),
    JobOrderStatus.IN_PROGRESS: frozenset({JobOrderStatus.COMPLETED, JobOrderStatus.CANCELLED}),
    JobOrderStatus.COMPLETED: frozenset(),
    JobOrderStatus.CANCELLED: frozenset(),
}


def is_transition_allowed(old_status: str, new_status: str) -> bool:
    if old_status == new_status:
        return True
    if old_status not in CANONICAL_STATUSES or new_status not in CANONICAL_STATUSES:
        return True
    allowed = ALLOWED_TRANSITIONS.get(old_status)
    if allowed is None:
        return True
    return new_status in allowed
