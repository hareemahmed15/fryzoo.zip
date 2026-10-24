import type { OrderStatus } from "@/lib/types";

const STYLES: Record<OrderStatus, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-sun-100 text-ink-900 ring-sun-400" },
  accepted:  { label: "Accepted",  cls: "bg-blue-50 text-blue-900 ring-blue-300" },
  preparing: { label: "Preparing", cls: "bg-orange-50 text-orange-900 ring-orange-300" },
  ready:     { label: "Ready",     cls: "bg-green-50 text-green-900 ring-green-400" },
  completed: { label: "Completed", cls: "bg-ink-900 text-white ring-ink-900" },
  rejected:  { label: "Rejected",  cls: "bg-brand-50 text-brand-800 ring-brand-400" },
  cancelled: { label: "Cancelled", cls: "bg-brand-50 text-brand-800 ring-brand-400" },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STYLES[status] ?? { label: status, cls: "bg-white text-ink-900 ring-ink-900/20" };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-2 ${s.cls}`}>
      {s.label}
    </span>
  );
}
