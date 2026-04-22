/** Tabbed settings hub: outline copy only; controls are not wired yet. */

export type SettingsTabId =
  | "organization"
  | "users-access"
  | "properties-units"
  | "tenants-leases-billing"
  | "payments-collections"
  | "communications"
  | "maintenance"
  | "system";

export type OutlineNode = {
  label: string;
  children?: OutlineNode[];
};

export type SettingsTabDefinition = {
  id: SettingsTabId;
  /** Short label for tab strip */
  tabLabel: string;
  /** Full section heading */
  title: string;
  outline: OutlineNode[];
};

export const SETTINGS_TABS: SettingsTabDefinition[] = [
  {
    id: "organization",
    tabLabel: "Organization",
    title: "Organization",
    outline: [
      { label: "Organization name, logo & brand colors" },
      {
        label: "Timezone (EAT – UTC+3 default), language & locale",
      },
      {
        label: "Currency (KES / UGX / TZS / USD – multi-currency support)",
      },
      { label: "Contact information & business registration details" },
    ],
  },
  {
    id: "users-access",
    tabLabel: "Users & access",
    title: "Users & access",
    outline: [
      { label: "Users list (name, role, status, last active)" },
      {
        label: "Roles & permissions (Admin, Manager, Accountant, Caretaker)",
      },
      { label: "Invite / deactivate users" },
      { label: "Activity & module access levels" },
    ],
  },
  {
    id: "properties-units",
    tabLabel: "Properties & units",
    title: "Properties & units",
    outline: [
      {
        label: "Property types (apartment, maisonette, commercial, bedsitter)",
      },
      { label: "Unit types & numbering rules" },
      {
        label: "Amenities list (borehole, standby generator, parking, DSQ)",
      },
      { label: "Caretaker / agent assignment per property" },
    ],
  },
  {
    id: "tenants-leases-billing",
    tabLabel: "Tenants, leases & billing",
    title: "Tenants, leases & billing",
    outline: [
      {
        label: "Tenant types (individual, company, NGO, government)",
      },
      { label: "Lease templates & default terms" },
      { label: "Grace periods & penalty / late fee rules" },
      { label: "Invoice & receipt templates" },
      {
        label: "Billing cycles (monthly default) & charge types",
        children: [
          { label: "Rent, water (unit-based), service charge, garbage, security" },
        ],
      },
      {
        label: "Tax configuration (VAT, withholding tax, agency fee)",
      },
    ],
  },
  {
    id: "payments-collections",
    tabLabel: "Payments & collections",
    title: "Payments & collections",
    outline: [
      {
        label: "Payment methods",
        children: [
          { label: "Mobile money (M-Pesa, Airtel Money, MTN MoMo)" },
          { label: "Bank transfer, cheque, cash" },
        ],
      },
      { label: "Mobile money paybill / till configuration" },
      {
        label: "Payment allocation rules & auto-reconciliation",
      },
      {
        label: "Arrears management & collection escalation rules",
      },
    ],
  },
  {
    id: "communications",
    tabLabel: "Communications",
    title: "Communications",
    outline: [
      {
        label:
          "SMS templates (primary channel – M-Pesa-style notifications)",
      },
      {
        label: "Email templates & WhatsApp notification triggers",
      },
      {
        label: "Reminder schedules (rent due, overdue, lease expiry)",
      },
    ],
  },
  {
    id: "maintenance",
    tabLabel: "Maintenance",
    title: "Maintenance",
    outline: [
      { label: "Service categories & priority levels" },
      { label: "Vendor / fundi management" },
      { label: "Work order defaults & SLA rules" },
    ],
  },
  {
    id: "system",
    tabLabel: "System",
    title: "System",
    outline: [
      { label: "API keys & third-party integrations" },
      { label: "Export formats (CSV, PDF)" },
      { label: "Scheduled & default reports" },
      { label: "Audit logs & data retention policies" },
    ],
  },
];

const TAB_IDS = new Set(SETTINGS_TABS.map((t) => t.id));

export function isSettingsTabId(value: string | null): value is SettingsTabId {
  return value != null && TAB_IDS.has(value as SettingsTabId);
}

export function defaultSettingsTabId(): SettingsTabId {
  return "organization";
}
