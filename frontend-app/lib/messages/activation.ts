/** User-facing copy when query string is missing `uid` or `token`. */
export const ACTIVATION_LINK_INCOMPLETE =
  "This activation link is incomplete. Open the full link from your email, or copy it into the address bar so it includes both uid and token.";

/**
 * Maps backend `detail` strings to clearer guidance (expired vs malformed).
 * @see backend/users/auth_views.py ActivateAccountView
 */
export function mapActivationApiDetail(detail: string): string {
  const d = detail.trim();
  if (/invalid uid/i.test(d)) {
    return "This activation link is not valid or is incomplete. Use the confirmation link from your email.";
  }
  if (/invalid or expired token/i.test(d)) {
    return "This activation link has expired or was already used. If you have already activated your account, sign in. If not, register again to receive a new confirmation email.";
  }
  return d;
}
