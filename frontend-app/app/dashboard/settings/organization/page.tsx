import { redirect } from "next/navigation";

/** Legacy route: full settings hub lives at `/dashboard/settings`. */
export default function OrganizationSettingsPage() {
  redirect("/dashboard/settings?tab=organization");
}
