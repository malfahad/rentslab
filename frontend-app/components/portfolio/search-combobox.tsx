"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const INPUT_CLASS =
  "mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#1A1A1A] outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20 disabled:cursor-not-allowed disabled:bg-[#F3F4F6]";

export type SearchComboboxProps<T> = {
  id?: string;
  /** Visible label above the field. Omit when `null` and set `ariaLabel`. */
  label?: ReactNode | null;
  /** Used when `label` is null (for a11y). */
  ariaLabel?: string;
  items: T[];
  value: string;
  onChange: (next: string) => void;
  getOptionId: (item: T) => string;
  getOptionLabel: (item: T) => string;
  /** Defaults to label; include extra fields for search (e.g. city). */
  getSearchText?: (item: T) => string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
  inputClassName?: string;
};

export function SearchCombobox<T>({
  id,
  label,
  ariaLabel,
  items,
  value,
  onChange,
  getOptionId,
  getOptionLabel,
  getSearchText,
  placeholder = "Search…",
  required,
  disabled,
  emptyMessage = "No matches",
  className,
  inputClassName,
}: SearchComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const searchText = useMemo(
    () => getSearchText ?? getOptionLabel,
    [getSearchText, getOptionLabel],
  );

  const selectedItem = useMemo(
    () => items.find((x) => getOptionId(x) === value),
    [items, value, getOptionId],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => searchText(x).toLowerCase().includes(q));
  }, [items, searchQuery, searchText]);

  useEffect(() => {
    if (value) setSearchQuery("");
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const inputDisplay = selectedItem ? getOptionLabel(selectedItem) : searchQuery;

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <label className="block text-sm">
        {label != null && label !== "" ? (
          <span className="font-medium text-[#374151]">{label}</span>
        ) : null}
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          autoComplete="off"
          required={required}
          disabled={disabled}
          className={`${INPUT_CLASS} ${inputClassName ?? ""}`}
          placeholder={placeholder}
          value={inputDisplay}
          onChange={(e) => {
            const v = e.target.value;
            if (selectedItem) {
              onChange("");
              setSearchQuery(v);
            } else {
              setSearchQuery(v);
            }
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </label>
      {open && !disabled ? (
        <ul
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[#6B7280]">{emptyMessage}</li>
          ) : (
            filtered.map((item) => {
              const oid = getOptionId(item);
              return (
                <li key={oid || "empty"}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface-section"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(oid);
                      setSearchQuery("");
                      setOpen(false);
                    }}
                  >
                    {getOptionLabel(item)}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
