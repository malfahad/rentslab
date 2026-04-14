import { Suspense } from "react";
import { CreditNotesPageClient } from "./credit-notes-page-client";

export default function CreditNotesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-[#6B7280]">
          Loading…
        </div>
      }
    >
      <CreditNotesPageClient />
    </Suspense>
  );
}
