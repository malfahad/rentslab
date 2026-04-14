"use client";

import type { ReactNode } from "react";
import { sortIndicator } from "@/components/portfolio/portfolio-table-sort";

export type PortfolioDataColumn<T> = {
  id: string;
  label: string;
  /** DRF `ordering` field name */
  sortField?: string;
  cell: (row: T) => ReactNode;
};

type Props<T> = {
  columns: PortfolioDataColumn<T>[];
  visibleColumnIds: Set<string>;
  rows: T[];
  loading: boolean;
  ordering: string;
  onSort: (field: string) => void;
  onRowClick: (row: T) => void;
  renderActions: (row: T) => ReactNode;
};

export function PortfolioDataTable<T extends { id: number }>({
  columns,
  visibleColumnIds,
  rows,
  loading,
  ordering,
  onSort,
  onRowClick,
  renderActions,
}: Props<T>) {
  const visible = columns.filter((c) => visibleColumnIds.has(c.id));
  const colSpan = visible.length + 1;

  return (
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead className="bg-[#F9FAFB] text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
        <tr>
          {visible.map((col) => {
            const ind = col.sortField
              ? sortIndicator(col.sortField, ordering)
              : null;
            return (
              <th key={col.id} className="whitespace-nowrap px-3 py-3">
                {col.sortField ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-semibold text-[#6B7280] hover:text-brand-navy"
                    onClick={() => onSort(col.sortField!)}
                  >
                    {col.label}
                    {ind === "asc" ? (
                      <span aria-hidden className="text-brand-navy">
                        ↑
                      </span>
                    ) : null}
                    {ind === "desc" ? (
                      <span aria-hidden className="text-brand-navy">
                        ↓
                      </span>
                    ) : null}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            );
          })}
          <th className="whitespace-nowrap px-3 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E5E7EB]">
        {loading ? (
          <tr>
            <td
              colSpan={colSpan}
              className="px-4 py-8 text-center text-[#6B7280]"
            >
              Loading…
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer hover:bg-[#F9FAFB]"
              onClick={() => onRowClick(row)}
            >
              {visible.map((col) => (
                <td key={col.id} className="px-3 py-2 align-top text-[#374151]">
                  {col.cell(row)}
                </td>
              ))}
              <td
                className="whitespace-nowrap px-3 py-2 text-right align-top"
                onClick={(e) => e.stopPropagation()}
              >
                {renderActions(row)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
