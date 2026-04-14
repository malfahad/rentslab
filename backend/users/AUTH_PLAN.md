# Auth flows (users app)

| Endpoint | Method | Auth | Behaviour |
|----------|--------|------|-------------|
| `/api/v1/auth/register/` | POST | none | Creates `User` (`is_active=False`), sets `_provision_org`; **signal** creates `Org` + `UserRole(org_admin)`. Sends activation email (token). |
| `/api/v1/auth/login/` | POST | none | Email + password → JWT access + refresh. |
| `/api/v1/auth/token/refresh/` | POST | none | Refresh access token (SimpleJWT). |
| `/api/v1/auth/forgot-password/` | POST | none | Accepts email; issues password-reset token; email (always 200 to avoid enumeration). |
| `/api/v1/auth/reset-password/` | POST | none | `uid` + `token` + `new_password`; validates token, sets password. |
| `/api/v1/auth/activate-account/` | POST | none | `uid` + `token`; sets `is_active=True`, `email_verified_at=now()`. |
| `/api/v1/auth/me/` | GET | JWT | Current user profile. |
| `/api/v1/auth/delete-account/` | POST | JWT | Password confirmation; soft-delete (`is_active=False`, `deleted_at`, email anonymized). |

**Signal:** `users.signals.provision_org_for_new_registration` runs on `User` `post_save` when `created` and `instance._provision_org` is true (set only by registration). Creates one `Org` and one `UserRole` with role `org_admin`.

**Production:** Configure real `EMAIL_BACKEND`, HTTPS, rate limits, and remove debug token leakage from responses.
