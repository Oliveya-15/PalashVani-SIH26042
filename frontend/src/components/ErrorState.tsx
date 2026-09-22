import { AlertCircle } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-card border border-danger/30 bg-danger/5 py-12 text-center">
      <AlertCircle className="text-danger" size={26} aria-hidden="true" />
      <p className="text-sm text-danger">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary !py-1.5 !px-4 text-sm">
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
