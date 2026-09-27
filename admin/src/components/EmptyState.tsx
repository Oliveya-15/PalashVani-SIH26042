import { Inbox } from "lucide-react";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border py-12 text-center">
      <Inbox className="text-ink-muted" size={24} aria-hidden="true" />
      <p className="font-display text-sm font-semibold text-ink">{title}</p>
      <p className="text-sm text-ink-muted">{body}</p>
    </div>
  );
}
