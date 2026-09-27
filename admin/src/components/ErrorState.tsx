import { AlertCircle } from "lucide-react";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-card border border-danger/30 bg-danger/5 py-10 text-center">
      <AlertCircle className="text-danger" size={24} aria-hidden="true" />
      <p className="text-sm text-danger">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary text-sm">
          Try again
        </button>
      )}
    </div>
  );
}
