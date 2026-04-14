"use client";

import { useEffect, useRef } from "react";

/**
 * Invokes `onLoadMore` when the sentinel enters the viewport (infinite scroll).
 */
export function PortfolioInfiniteSentinel({
  onLoadMore,
  disabled,
  rootMargin = "120px",
}: {
  onLoadMore: () => void;
  disabled?: boolean;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onLoadMore, disabled, rootMargin]);

  return (
    <div
      ref={ref}
      className="col-span-full flex min-h-8 items-center justify-center py-4 text-sm text-[#6B7280]"
      aria-hidden
    />
  );
}
