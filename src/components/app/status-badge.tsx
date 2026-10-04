import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/academic";

export function StatusBadge({ status, className }: { status: Status | string; className?: string }) {
  const map = {
    verified: { icon: CheckCircle2, label: "Verified", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    pending: { icon: Clock, label: "Pending", cls: "bg-amber-50 text-amber-600 border-amber-200" },
    rejected: { icon: XCircle, label: "Rejected", cls: "bg-red-50 text-red-600 border-red-200" },
  } as const;
  const m = map[(status as Status) ?? "pending"] ?? map.pending;
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold", m.cls, className)}>
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}
