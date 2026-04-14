# RentSlab System — HTTP API Reference

This document describes the **Django REST Framework** JSON API exposed under **`/api/v1/`**. It reflects the current backend implementation in `backend/`.

---

## Base URL and versioning

| Item | Value |
|------|--------|
| API root | `{origin}/api/v1/` |
| Content type | `application/json` (use `format=json` on DRF test client or send JSON bodies with `Content-Type: application/json`) |

**Example:** `GET https://your-host.example/api/v1/orgs/`

---

## Authentication

### JWT (Simple JWT)

Most endpoints accept a **Bearer** access token.

| Header | Format |
|--------|--------|
| `Authorization` | `Bearer <access_token>` |

Tokens are obtained from **`POST /api/v1/auth/login/`** (or registration flow). Refresh using **`POST /api/v1/auth/token/refresh/`** with body:

```json
{
  "refresh": "<refresh_token>"
```

The login response includes:

- `access` — short-lived access JWT  
- `refresh` — refresh token  
- `user` — serialized user object (see [User fields](#user-fields))

Unauthenticated requests to protected endpoints typically receive **`401 Unauthorized`**.

---

## Organization context (`X-Org-ID`)

Many endpoints are scoped to a single organization. The **active org** is selected by:

| Header | Meaning |
|--------|---------|
| `X-Org-ID` | Integer primary key of the organization |

The server must resolve the header to an org where the user has a **`UserRole`** (membership). If the header is missing, invalid, or the user is not a member of that org, **`RequiresOrgContext`** permission fails with **`403 Forbidden`**.

**Middleware:** `OrgContextMiddleware` also sets `request.org_id` / `request.org` when the header is valid and the user is a member.

---

## Default permissions (global)

`REST_FRAMEWORK` uses **`AllowAny`** as the default permission class. Individual viewsets override this (see below). Endpoints that **do not** set stricter permissions are publicly callable unless you change the global default—**notably `/api/v1/users/` and `/api/v1/orgs/`** as implemented today.

---

## Row-level filtering (list/retrieve)

For org-scoped domain resources (buildings, units, leases, tenants, invoices, payments, etc.), list and retrieve querysets are filtered by **`access.services.user_filtered_results()`**:

- **Org admins** (`UserRole` with role key **`admin`**) see all rows in that org (subject to the base queryset).
- **ORG-wide `VIEW` or `MANAGE`** on `scope=ORG` with `object_id` null (via **`ShareGrant`**) sees all rows in that org for that resource type.
- Otherwise, results are limited to **`ShareGrant`** visibility (scopes **`ORG`**, **`BUILDING`**, **`UNIT`**, **`LEASE`**, **`TENANT`**) with **`VIEW`** or **`MANAGE`**.
- **Landlord** and **Service** resources are only visible when the user has org-wide visibility (no finer-grained scope exists for those models yet).

---

## Roles and access definitions

| Concept | Description |
|---------|-------------|
| **`RoleDefinition`** | Per-org role (`key`, `name`, `is_system`). System roles **`admin`** and **`org_member`** are created when an org is created; cannot be deleted. |
| **`UserRole`** | Links a user to an org with a **`role_definition`**. |
| **`ShareGrant`** | Grants **`VIEW`** or **`MANAGE`** on a **`scope`** and optional **`object_id`** (or org-wide when `scope=ORG` and `object_id` is null). |

### Scopes (`ShareGrant.scope`)

| Value | Meaning |
|-------|---------|
| `ORG` | Organization; `object_id` null = org-wide ALL |
| `BUILDING` | Building id in `object_id` |
| `UNIT` | Unit id in `object_id` |
| `LEASE` | Lease id in `object_id` |
| `TENANT` | Tenant id in `object_id` |

### Permission levels (`ShareGrant.permission_level`)

| Value | Meaning |
|-------|---------|
| `VIEW` | Read access |
| `MANAGE` | Manage access (implies view for permission checks) |

### Upward propagation (signals)

When a **`ShareGrant`** with **`VIEW`** or **`MANAGE`** is saved for **`UNIT`**, a derived **`VIEW`** grant on the **parent building** may be created so navigation stays consistent. **ORG-wide** grants are **not** auto-created from building/unit grants (see `access/signals.py`).

---

# Endpoints

Conventions below use **Django REST Framework `DefaultRouter`** unless noted. Standard routes:

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/resource/` | List |
| `POST` | `/resource/` | Create |
| `GET` | `/resource/{id}/` | Retrieve |
| `PUT` | `/resource/{id}/` | Full update |
| `PATCH` | `/resource/{id}/` | Partial update |
| `DELETE` | `/resource/{id}/` | Destroy |

---

## Auth (`/api/v1/auth/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register/` | — | Register. Body: `email`, `password` (min 8 chars), optional `org_name`. Creates user (inactive), provisions org and admin role via signals when `org_name` / default applies. **201** with `detail`, `user_id`; in DEBUG, `debug_activation` may include `uid` and `token`. |
| `POST` | `/auth/login/` | — | Body: `email`, `password`. **200** with `access`, `refresh`, `user`. |
| `POST` | `/auth/token/refresh/` | — | Body: `refresh`. Returns new access token (Simple JWT). |
| `POST` | `/auth/forgot-password/` | — | Body: `email`. Always responds with generic success message; email sent if user exists. |
| `POST` | `/auth/reset-password/` | — | Body: `uid`, `token`, `new_password` (min 8). |
| `POST` | `/auth/activate-account/` | — | Body: `uid`, `token`. Sets user active and `email_verified_at`. |
| `GET` | `/auth/me/` | JWT | Current user profile (`UserSerializer`). |
| `POST` | `/auth/delete-account/` | JWT | Body: `password`. Soft-deletes the account. |

---

## Users (`/api/v1/users/`)

ViewSet: **`UserViewSet`** (`ModelViewSet`). **Default permission: `AllowAny`** (no explicit restriction in code).

### User fields (`UserSerializer`)

| Field | Type | Notes |
|-------|------|--------|
| `id` | integer | Read-only |
| `username` | string | |
| `email` | string | |
| `first_name` | string | |
| `last_name` | string | |
| `phone` | string | |
| `is_active` | boolean | |
| `email_verified_at` | datetime / null | Read-only |
| `deleted_at` | datetime / null | Read-only |
| `created_at` | datetime | Read-only |
| `updated_at` | datetime | Read-only |

---

## Organizations (`/api/v1/orgs/`)

ViewSet: **`OrgViewSet`** (`ModelViewSet`). **Default permission: `AllowAny`** (no explicit restriction).

### Org fields (`OrgSerializer`)

| Field | Type |
|-------|------|
| `id` | integer |
| `name` | string |
| `org_type` | string (default `property_manager`) |
| `created_at` | datetime |
| `updated_at` | datetime |

---

## User roles (`/api/v1/user-roles/`)

**Auth:** JWT **and** **`X-Org-ID`**.

| Action | Permission |
|--------|------------|
| `list`, `retrieve` | `IsAuthenticated` + **`RequiresOrgContext`** (member of org) |
| `create`, `update`, `partial_update`, `destroy` | `IsAuthenticated` + **`IsOrgAdminOrgHeader`** (org admin) |

### UserRole fields (`UserRoleSerializer`)

| Field | Type | Notes |
|-------|------|--------|
| `id` | integer | Read-only |
| `user` | integer (user id) | |
| `org` | integer | Read-only on create; set from header |
| `role_definition` | integer | FK to `RoleDefinition` |
| `role_key` | string | Read-only; `role_definition.key` |
| `created_at` | datetime | Read-only |
| `updated_at` | datetime | Read-only |

---

## Access — roles & shares (`/api/v1/access/`)

Router registers:

- **`/api/v1/access/roles/`** → `RoleDefinitionViewSet`
- **`/api/v1/access/shares/`** → `ShareGrantViewSet`

### Role definitions (`/access/roles/`)

**Auth:** JWT **and** **`X-Org-ID`**.

| Action | Permission |
|--------|------------|
| `list`, `retrieve` | `IsAuthenticated` + **`RequiresOrgContext`** |
| `create`, `update`, `partial_update`, `destroy` | `IsAuthenticated` + **`IsOrgAdminOrgHeader`** |

Destroy on **system** roles (`is_system=true`) returns **403** with *“System roles cannot be deleted.”*

#### RoleDefinition fields

| Field | Type | Notes |
|-------|------|--------|
| `id` | integer | Read-only |
| `org` | integer | Read-only; set on create from header |
| `key` | string | Slug |
| `name` | string | |
| `is_system` | boolean | Read-only |
| `created_at` | datetime | Read-only |
| `updated_at` | datetime | Read-only |

### Share grants (`/access/shares/`)

**Auth:** JWT **and** **`X-Org-ID`**.

| Method | Allowed |
|--------|---------|
| `GET` (list, retrieve) | `POST`, `DELETE` (no `PUT`/`PATCH` on viewset) |

**Permission class:** **`IsOrgAdminOrShareManager`**

- **List:** org **admin**, or user with **`MANAGE`** on **`ORG`** with `object_id` null (org-wide managers).
- **Create:** org **admin**, or user who can **`user_can_manage_share_target`** for the `scope` / `object_id` in the body.
- **Retrieve / destroy:** enforced per object: org admin **or** **`user_can_manage_share_target`** for that grant’s `scope` / `object_id`.

#### ShareGrant fields

| Field | Type | Notes |
|-------|------|--------|
| `id` | integer | Read-only |
| `org` | integer | Read-only; set on create |
| `scope` | string | One of `ORG`, `BUILDING`, `UNIT`, `LEASE`, `TENANT` |
| `object_id` | integer / null | Omit or null for org-wide `ORG` |
| `grantee` | integer | User id |
| `permission_level` | string | `VIEW` or `MANAGE` |
| `granted_by` | integer / null | Read-only |
| `created_at` | datetime | Read-only |
| `updated_at` | datetime | Read-only |

---

## Domain resources (org-scoped + filtered)

The following viewsets use **`OrgScopedViewSetMixin`**:

- **Auth:** `IsAuthenticated` + **`RequiresOrgContext`**
- **Header:** **`X-Org-ID`**
- **Queryset:** base filter by org (or relation to org), then **`user_filtered_results`** by resource `kind`

| Resource | `kind` | Base path |
|----------|--------|-----------|
| Landlord | `landlord` | `/api/v1/landlords/` |
| Building | `building` | `/api/v1/buildings/` |
| Unit | `unit` | `/api/v1/units/` |
| Tenant | `tenant` | `/api/v1/tenants/` |
| Lease | `lease` | `/api/v1/leases/` |
| Service | `service` | `/api/v1/services/` |
| Service subscription | `service_subscription` | `/api/v1/service-subscriptions/` |
| Invoice | `invoice` | `/api/v1/invoices/` |
| Invoice line item | `invoice_line_item` | `/api/v1/invoice-line-items/` |
| Credit note | `credit_note` | `/api/v1/credit-notes/` |
| Payment | `payment` | `/api/v1/payments/` |
| Payment allocation | `payment_allocation` | `/api/v1/payment-allocations/` |

All support standard **`ModelViewSet`** routes unless otherwise noted.

---

### Landlords (`/landlords/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `org` | integer | FK |
| `name` | string |
| `created_at` | datetime |
| `updated_at` | datetime |

---

### Buildings (`/buildings/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `org` | integer | FK |
| `landlord` | integer | FK |
| `name` | string |
| `building_type` | string (default `residential`) |
| `created_at` | datetime |
| `updated_at` | datetime |

---

### Units (`/units/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `building` | integer | FK |
| `unit_number` | string |
| `unit_type` | string (default `apartment`) |
| `status` | string (default `vacant`) |
| `created_at` | datetime |
| `updated_at` | datetime |

---

### Tenants (`/tenants/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `org` | integer | FK |
| `name` | string |
| `tenant_type` | string (default `individual`) |
| `created_at` | datetime |
| `updated_at` | datetime |

---

### Leases (`/leases/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `unit` | integer | FK |
| `tenant` | integer | FK |
| `managed_by` | integer / null | User FK |
| `start_date` | date |
| `end_date` | date / null |
| `rent_amount` | decimal |
| `deposit_amount` | decimal / null |
| `billing_cycle` | string (default `monthly`) |
| `status` | string (default `active`) |
| `created_at` | datetime |
| `updated_at` | datetime |

---

### Services (`/services/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `org` | integer | FK |
| `name` | string |
| `billing_type` | string (default `fixed`) |
| `is_active` | boolean |
| `created_at` | datetime |
| `updated_at` | datetime |

---

### Service subscriptions (`/service-subscriptions/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `lease` | integer | FK |
| `service` | integer | FK |
| `rate` | decimal |
| `billing_cycle` | string (default `monthly`) |
| `created_at` | datetime |
| `updated_at` | datetime |

---

### Invoices (`/invoices/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `lease` | integer | FK |
| `org` | integer / null | FK |
| `invoice_number` | string |
| `issue_date` | date |
| `due_date` | date |
| `total_amount` | decimal |
| `status` | string (default `unpaid`) |
| `created_at` | datetime |
| `updated_at` | datetime |

---

### Invoice line items (`/invoice-line-items/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `invoice` | integer | FK |
| `line_number` | integer (default 1) |
| `description` | string |
| `amount` | decimal |
| `service` | integer / null | FK |
| `created_at` | datetime |

---

### Credit notes (`/credit-notes/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `invoice` | integer | FK |
| `amount` | decimal |
| `reason` | string |
| `credit_date` | date |
| `created_at` | datetime |

---

### Payments (`/payments/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `org` | integer | FK |
| `tenant` | integer | FK |
| `lease` | integer / null | FK |
| `amount` | decimal |
| `method` | string (default `bank`) |
| `reference` | string |
| `payment_date` | datetime |
| `created_at` | datetime |
| `updated_at` | datetime |

---

### Payment allocations (`/payment-allocations/`)

| Field | Type |
|-------|------|
| `id` | integer |
| `payment` | integer | FK |
| `invoice` | integer | FK |
| `amount_applied` | decimal |
| `created_at` | datetime |

---

## Error responses

Validation errors from DRF typically return **`400 Bad Request`** with a JSON body of field errors or `detail`.

Permission denied returns **`403 Forbidden`**.

Not found returns **`404 Not Found`**.

---

## Related files (implementation map)

| Concern | Location |
|---------|----------|
| URL aggregation | `backend/config/api_urls.py` |
| Auth routes | `backend/users/auth_urls.py`, `backend/users/auth_views.py` |
| JWT settings | `backend/config/settings.py` (`SIMPLE_JWT`, `REST_FRAMEWORK`) |
| Org header & membership | `backend/access/middleware.py`, `backend/access/services.py` (`get_org_id_from_request`, …) |
| Permissions | `backend/access/permissions.py` |
| Row filtering | `backend/access/services.py` (`user_filtered_results`) |
| Org-scoped viewsets | `backend/access/view_mixins.py` |

---

*Generated from the backend codebase. If behavior diverges from this document, trust the code and tests.*
