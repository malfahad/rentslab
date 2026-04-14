"use client";

import { useEffect } from "react";

export function ConfirmDeleteDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  pending,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-xl"
        role="alertdialog"
        aria-modal="true"
      >
        <h2 className="font-serif text-lg font-medium text-brand-navy">{title}</h2>
        <p className="mt-2 text-sm text-[#6B7280]">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger-sm"
            onClick={onConfirm}
            disabled={pending}
            data-testid="confirm-delete"
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
