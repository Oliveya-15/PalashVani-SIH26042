const TONES: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-ink-muted/10 text-ink-muted",
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`badge ${TONES[tone]}`}>{children}</span>;
}
