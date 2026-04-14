"use client";

import { useState } from "react";
import { useOrg } from "@/contexts/org-context";

export function OrgMissingBanner() {
  const { setOrgId, refreshOrgLabel } = useOrg();
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  function save() {
    const n = parseInt(raw.trim(), 10);
    if (!Number.isFinite(n) || n < 1) {
      setError("Enter a valid organization ID number.");
      return;
    }
    setError(null);
    setOrgId(n);
    refreshOrgLabel().catch(() => {});
  }

  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      data-testid="org-missing-banner"
    >
      <p className="font-medium">No organization selected</p>
      <p className="mt-1 text-amber-900/90">
        Portfolio APIs send <code className="rounded bg-amber-100 px-1">X-Org-ID</code>{" "}
        using your membership. If your account has no organization yet, create one from
        registration or ask an admin to invite you. For local dev you can set{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_DEFAULT_ORG_ID</code>{" "}
        or enter an org id you belong to:
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Org ID"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="h-9 w-32 rounded-md border border-amber-300 bg-white px-2 text-[#1A1A1A]"
        />
        <button type="button" onClick={save} className="btn-primary-sm">
          Save
        </button>
      </div>
      {error ? <p className="mt-2 text-red-700">{error}</p> : null}
    </div>
  );
}
