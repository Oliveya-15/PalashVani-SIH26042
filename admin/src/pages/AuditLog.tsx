import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { api } from "@/api/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { Badge } from "@/components/Badge";
import { formatDateTime } from "@/utils/format";

const ACTION_TONE: Record<string, "success" | "warning" | "danger" | "secondary"> = {
  create: "success", update: "warning", delete: "danger", link_entry: "secondary",
};

function toneFor(action: string) {
  const verb = action.split(".")[1] ?? "";
  return ACTION_TONE[verb] ?? "secondary";
}

export default function AuditLogPage() {
  const { token } = useAdminAuth();
  const [page, setPage] = useState(1);

  const auditQuery = useQuery({
    queryKey: ["admin-audit-log", page],
    queryFn: () => api.dashboard.auditLog(token as string, page),
    enabled: Boolean(token),
  });

  const totalPages = auditQuery.data ? Math.max(1, Math.ceil(auditQuery.data.total / auditQuery.data.page_size)) : 1;

  return (
    <div className="p-6 sm:p-8">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
        <ScrollText size={22} aria-hidden="true" /> Audit Log
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Every write any admin has made through this panel -- user changes, dataset edits, rights clearances,
        curriculum changes. This is what makes "activity and permission are controlled from admin" a real,
        checkable claim.
      </p>

      <div className="mt-6">
        {auditQuery.isLoading && <LoadingState label="Loading audit log..." />}
        {auditQuery.isError && <ErrorState message="Couldn't load the audit log." onRetry={() => auditQuery.refetch()} />}

        {auditQuery.data && auditQuery.data.items.length === 0 && (
          <EmptyState title="No admin actions yet" body="Every user/dataset/curriculum change made from this panel will appear here." />
        )}

        {auditQuery.data && auditQuery.data.items.length > 0 && (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Admin</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditQuery.data.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{formatDateTime(item.created_at)}</td>
                    <td className="px-4 py-3 text-ink">{item.admin_name || `#${item.admin_user_id}`}</td>
                    <td className="px-4 py-3"><Badge tone={toneFor(item.action)}>{item.action}</Badge></td>
                    <td className="px-4 py-3 text-ink-muted">{item.target_type}{item.target_id ? ` #${item.target_id}` : ""}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-ink-muted" title={item.details}>{item.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {auditQuery.data && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
      </div>
    </div>
  );
}
