import { redirect } from "next/navigation";

type LegacyReceiptRedirectPageProps = {
  params: Promise<{ hashedPaymentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toQueryString(search: Record<string, string | string[] | undefined>): string {
  const qs = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (typeof value === "string") {
      qs.set(key, value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => qs.append(key, entry));
    }
  });
  const out = qs.toString();
  return out ? `?${out}` : "";
}

export default async function LegacyReceiptRedirectPage({
  params,
  searchParams,
}: LegacyReceiptRedirectPageProps) {
  const { hashedPaymentId } = await params;
  const query = toQueryString(await searchParams);
  redirect(`/docs/receipt/${hashedPaymentId}${query}`);
}
