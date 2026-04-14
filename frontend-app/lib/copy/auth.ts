/** User-facing marketing and helper copy for auth flows. */

export const COPY = {
  loginTitle: "Welcome back",
  loginSubtitle:
    "Sign in to your workspace to manage properties, leases, tenants, and payments in one place.",

  registerTitle: "Create your workspace",
  registerSubtitle:
    "Set up your organization in a few minutes. You’ll confirm your email before your first sign-in.",

  registerPasswordHint: "At least 8 characters.",

  registerSuccessTitle: "Check your inbox",
  registerSuccessBody:
    "We sent a confirmation link to your email. Open it on this device to activate your account, then come back here to sign in.",

  activateTitle: "Confirm your email",
  activateLoadingBody:
    "Hang tight—we’re verifying your link and turning on your account.",

  activateSuccessTitle: "You’re all set",
  activateSuccessSubtitle:
    "Your account is active. Use the same email and password you chose when you registered.",

  activateErrorTitle: "We couldn’t use this link",
  activateMissingTitle: "This link looks incomplete",
  activateMissingSubtitle:
    "Make sure you opened the full URL from your email, or paste the entire line into your browser.",

  activateSuccessPrimaryCta: "Continue to sign in",
  activateErrorPrimaryCta: "Try signing in",
  activateErrorSecondaryCta: "Create a new account",

  homeRedirect: "Taking you to your workspace…",
} as const;
