import type { SeverityLevel } from "@/types";

const styles: Record<SeverityLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-rose-200 bg-rose-50 text-rose-700"
};

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-normal ${styles[severity]}`}>
      {severity}
    </span>
  );
}

