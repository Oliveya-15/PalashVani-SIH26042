import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, body, confirmLabel = "Confirm", danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Cancel" className="absolute inset-0 bg-ink/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-card bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className={danger ? "text-danger" : "text-warning"} size={22} aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{body}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
          <button type="button" onClick={onConfirm} className={danger ? "btn-danger text-sm" : "btn-primary text-sm"}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
