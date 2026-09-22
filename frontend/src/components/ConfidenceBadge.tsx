import { AlertTriangle, CheckCircle2, HelpCircle, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import type { ConfidenceLabel } from "@/types";

const STYLES: Record<ConfidenceLabel, { classes: string; Icon: typeof CheckCircle2 }> = {
  high: { classes: "bg-success/10 text-success border-success/30", Icon: ShieldCheck },
  medium: { classes: "bg-warning/10 text-warning border-warning/30", Icon: AlertTriangle },
  low: { classes: "bg-warning/10 text-warning border-warning/30", Icon: AlertTriangle },
  none: { classes: "bg-ink-muted/10 text-ink-muted border-ink-muted/30", Icon: HelpCircle },
};

const LABEL_KEYS: Record<ConfidenceLabel, string> = {
  high: "translate.confidenceHigh",
  medium: "translate.confidenceMedium",
  low: "translate.confidenceLow",
  none: "translate.confidenceNone",
};

export function ConfidenceBadge({ label }: { label: ConfidenceLabel }) {
  const { t } = useI18n();
  const { classes, Icon } = STYLES[label];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      <Icon size={14} aria-hidden="true" />
      {t(LABEL_KEYS[label])}
    </span>
  );
}
