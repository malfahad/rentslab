"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  IconColumns,
  PortfolioToolbarIconButton,
} from "@/components/portfolio/portfolio-table-toolbar-icons";

export function PortfolioColumnPicker({
  labels,
  visibleIds,
  onChange,
  testId = "portfolio-column-picker",
  renderTrigger,
}: {
  labels: { id: string; label: string }[];
  visibleIds: Set<string>;
  onChange: (next: Set<string>) => void;
  testId?: string;
  /** Custom trigger; default is a flat columns icon. */
  renderTrigger?: (args: {
    open: boolean;
    toggle: () => void;
  }) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function toggleColumn(id: string) {
    const next = new Set(visibleIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  const toggleOpen = () => setOpen((o) => !o);

  return (
    <div className="relative" ref={rootRef} data-testid={testId}>
      {renderTrigger ? (
        renderTrigger({ open, toggle: toggleOpen })
      ) : (
        <PortfolioToolbarIconButton
          label="Columns"
          active={open}
          onClick={toggleOpen}
          testId={`${testId}-trigger`}
        >
          <IconColumns />
        </PortfolioToolbarIconButton>
      )}
      {open ? (
        <div className="absolute right-0 z-20 mt-1 max-h-72 min-w-[200px] overflow-auto rounded-lg border border-[#E5E7EB] bg-white py-2 shadow-lg">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Show columns
          </p>
          <ul className="space-y-1 px-2">
            {labels.map(({ id, label }) => (
              <li key={id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[#F9FAFB]">
                  <input
                    type="checkbox"
                    checked={visibleIds.has(id)}
                    onChange={() => toggleColumn(id)}
                    className="rounded border-[#D1D5DB] text-brand-navy focus:ring-brand-navy"
                  />
                  <span className="text-[#374151]">{label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
