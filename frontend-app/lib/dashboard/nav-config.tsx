import type { ReactNode } from "react";

export type NavIconProps = { className?: string };

export type NavLeaf = {
  href: string;
  label: string;
  icon: (p: NavIconProps) => ReactNode;
};

export type NavGroup = {
  id: string;
  label: string;
  defaultOpen?: boolean;
  items: NavLeaf[];
};

function IconDashboard({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBuilding({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 21V8l8-4 8 4v13M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGrid({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 5h7v7H4V5zm9 0h7v7h-7V5zM4 14h7v7H4v-7zm9 0h7v7h-7v-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm12 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFile({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCredit({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 10h16M8 14h.01M12 14h2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWrench({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 19V5M4 19h16M8 15v4M12 11v8M16 7v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLandlord({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Collapsible groups for the left nav (aligned with plan.md). */
export const DASHBOARD_NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    defaultOpen: true,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    defaultOpen: true,
    items: [
      { href: "/dashboard/landlords", label: "Landlords", icon: IconLandlord },
      { href: "/dashboard/buildings", label: "Buildings", icon: IconBuilding },
      { href: "/dashboard/units", label: "Units", icon: IconGrid },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    defaultOpen: true,
    items: [
      { href: "/dashboard/tenants", label: "Tenants", icon: IconUsers },
      { href: "/dashboard/leases", label: "Leases", icon: IconFile },
      { href: "/dashboard/payments", label: "Payments", icon: IconCredit },
      { href: "/dashboard/maintenance", label: "Maintenance", icon: IconWrench },
      { href: "/dashboard/reports", label: "Reports", icon: IconChart },
    ],
  },
];
