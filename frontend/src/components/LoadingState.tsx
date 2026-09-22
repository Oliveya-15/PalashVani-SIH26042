import { Loader2 } from "lucide-react";

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted" role="status" aria-live="polite">
      <Loader2 className="animate-spin" size={28} aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
