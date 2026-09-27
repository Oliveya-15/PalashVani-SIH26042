import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  hint?: string;
}

export function StatCard({ label, value, Icon, hint }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">{label}</p>
        <Icon className="text-primary" size={18} aria-hidden="true" />
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
