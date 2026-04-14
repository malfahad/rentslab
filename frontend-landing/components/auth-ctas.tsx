import { getDemoUrl, getLoginUrl, getRegisterUrl } from "@/lib/auth-urls";

type Theme = "dark" | "light";

const baseBtn =
  "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-normal transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function AuthCtas({
  theme = "light",
  className = "",
}: {
  theme?: Theme;
  className?: string;
}) {
  const loginUrl = getLoginUrl();
  const registerUrl = getRegisterUrl();
  const demoUrl = getDemoUrl();

  const primary =
    theme === "dark"
      ? `${baseBtn} bg-brand-gold text-brand-navy hover:opacity-90 focus-visible:outline-white`
      : `${baseBtn} bg-brand-gold text-brand-navy hover:opacity-90 focus-visible:outline-brand-navy`;

  const secondary =
    theme === "dark"
      ? `${baseBtn} border border-white/80 bg-transparent text-white hover:bg-white/10 focus-visible:outline-white`
      : `${baseBtn} border border-gray-300 bg-white text-brand-navy hover:border-brand-navy focus-visible:outline-brand-navy`;

  const demo =
    theme === "dark"
      ? `${baseBtn} border border-brand-gold/60 bg-white/5 text-brand-gold hover:bg-white/10 focus-visible:outline-brand-gold`
      : `${baseBtn} border border-brand-navy/25 bg-transparent text-brand-navy hover:border-brand-navy/50 focus-visible:outline-brand-navy`;

  const showHint = !registerUrl && !loginUrl && !demoUrl;

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {registerUrl ? (
        <a href={registerUrl} className={primary}>
          Sign up
        </a>
      ) : null}
      {demoUrl ? (
        <a href={demoUrl} className={demo}>
          View demo dashboard
        </a>
      ) : null}
      {loginUrl ? (
        <a href={loginUrl} className={secondary}>
          Log in
        </a>
      ) : null}
      {showHint ? (
        <p className="text-sm text-[#9CA3AF]">
          Set{" "}
          <code className="rounded bg-black/10 px-1 dark:bg-white/10">
            NEXT_PUBLIC_REGISTER_URL
          </code>
          ,{" "}
          <code className="rounded bg-black/10 px-1 dark:bg-white/10">
            NEXT_PUBLIC_LOGIN_URL
          </code>
          , or{" "}
          <code className="rounded bg-black/10 px-1 dark:bg-white/10">
            NEXT_PUBLIC_DEMO_URL
          </code>
        </p>
      ) : null}
    </div>
  );
}
