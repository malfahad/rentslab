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

function IconLease({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M8 13h8M8 17h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconService({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}

function IconInvoice({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h6" strokeLinecap="round" strokeLinejoin="round" />
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

function IconPayment({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconExpense({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 3v18M19 9l-7-6-7 6M5 15l7 6 7-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconJobOrder({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Storefront / shop — distinct from a generic “home” icon. */
function IconVendor({ className }: NavIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m2 7 4.41-4.41a2 2 0 0 1 2.83 0L12 7" />
      <path d="M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M10 10h4" />
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

/** Collapsible groups for the left nav. */
export const DASHBOARD_NAV_GROUPS: NavGroup[] = [
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
      { href: "/dashboard/leases", label: "Lease Arrangements", icon: IconLease },
      { href: "/dashboard/services", label: "Services", icon: IconService },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    defaultOpen: true,
    items: [
      { href: "/dashboard/invoices", label: "Invoices", icon: IconInvoice },
      { href: "/dashboard/credit-notes", label: "Credit Notes", icon: IconCredit },
      { href: "/dashboard/payments", label: "Payments", icon: IconPayment },
      { href: "/dashboard/expenses", label: "Expenses", icon: IconExpense },
    ],
  },
  {
    id: "maintenance",
    label: "Maintenance",
    defaultOpen: true,
    items: [
      { href: "/dashboard/job-orders", label: "Job Orders", icon: IconJobOrder },
      { href: "/dashboard/vendors", label: "Vendors", icon: IconVendor },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    defaultOpen: true,
    items: [{ href: "/dashboard/reports", label: "Reports", icon: IconChart }],
  },
];
