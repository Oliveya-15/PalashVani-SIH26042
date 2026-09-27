export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
