import type { SeverityLevel } from "@/types";

const styles: Record<SeverityLevel, string> = {
  low: "bg-success text-white",
  medium: "bg-warning text-white",
  high: "bg-danger text-white"
};

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-normal ${styles[severity]}`}>
      {severity}
    </span>
  );
}
