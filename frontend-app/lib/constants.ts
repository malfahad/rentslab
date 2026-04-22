/** Default Django origin when `NEXT_PUBLIC_API_ORIGIN` is unset (no trailing slash). */
export const DEFAULT_API_ORIGIN = "http://127.0.0.1:8002";

/** API version prefix under the Django host (see `config/urls.py`). */
export const API_V1_PREFIX = "/api/v1";

/** Default copy when registration succeeds without a `detail` field. */
export const DEFAULT_REGISTER_SUCCESS_MESSAGE =
  "Registration successful. Check your email to activate your account.";
