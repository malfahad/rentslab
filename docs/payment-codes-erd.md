# RentSlab Payment Codes ERD

```mermaid
erDiagram
  UNIT ||--o| PAYMENT_LINK : "has one public link"
  PAYMENT_LINK ||--o{ PAYMENT_LINK_PAYMENT : "records attempts"
  LEASE }o--|| UNIT : "active lease resolves by unit"
  INVOICE }o--|| LEASE : "issued under lease"
  PAYMENT_LINK_PAYMENT }o--|| INVOICE : "attempt targets invoice"
  BUILDING ||--o{ UNIT : "contains units"
  TENANT ||--o{ LEASE : "holds leases"

  UNIT {
    bigint id PK
    varchar payment_code UK
    varchar payment_code_status
    varchar unit_number
    bigint building_id FK
  }

  PAYMENT_LINK {
    bigint id PK
    bigint unit_id FK
    varchar slug UK
    bool is_active
    datetime expires_at
  }

  PAYMENT_LINK_PAYMENT {
    bigint id PK
    bigint payment_link_id FK
    bigint invoice_id FK
    decimal amount
    varchar status
    varchar provider_ref
  }

  LEASE {
    bigint id PK
    bigint unit_id FK
    bigint tenant_id FK
    varchar status
  }

  INVOICE {
    bigint id PK
    bigint lease_id FK
    decimal total_amount
    date due_date
    varchar status
  }
```

## Behavior Notes

- `Unit.payment_code` is stable and permanent for the unit.
- Payment link visibility is controlled by `PaymentLink.is_active` and optional `expires_at`.
- Public payment attempts are captured as `PaymentLinkPayment` with lifecycle:
  `created -> processing -> confirmed | failed | refunded`.
