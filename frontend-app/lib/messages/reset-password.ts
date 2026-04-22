export const RESET_LINK_INCOMPLETE =
  "This reset link is incomplete. Open the full link from your email, or copy it into the address bar so it includes both uid and token.";

export function mapResetPasswordApiDetail(detail: string): string {
  const d = detail.trim();
  if (/invalid uid/i.test(d)) {
    return "This reset link is not valid or is incomplete. Use the full link from your email.";
  }
  if (/invalid or expired token/i.test(d)) {
    return "This reset link has expired or has already been used. Request a new reset email and try again.";
  }
  return d;
}
