import { useQuery } from "@tanstack/react-query";
import { Users, Languages, BookOpen, AlertTriangle, MessageSquare, Activity } from "lucide-react";
import { api } from "@/api/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { StatCard } from "@/components/StatCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";

export default function Dashboard() {
  const { token } = useAdminAuth();
  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.dashboard.stats(token as string),
    enabled: Boolean(token),
    refetchInterval: 60_000,
  });

  return (
    <div className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Real, computed figures from the live database -- nothing here is a placeholder.
      </p>

      {statsQuery.isLoading && <LoadingState label="Loading dashboard..." />}
      {statsQuery.isError && <ErrorState message="Couldn't load dashboard stats." onRetry={() => statsQuery.refetch()} />}

      {statsQuery.data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Total users" value={statsQuery.data.total_users} Icon={Users}
                      hint={`${statsQuery.data.users_by_role.teacher} teachers · ${statsQuery.data.users_by_role.student} students · ${statsQuery.data.users_by_role.admin} admins`} />
            <StatCard label="Active users (7 days)" value={statsQuery.data.active_users_7d} Icon={Activity}
                      hint="Users who ran at least one translation" />
            <StatCard label="Translations served" value={statsQuery.data.total_translations_served} Icon={Languages}
                      hint={`${statsQuery.data.translations_last_7d} in the last 7 days`} />
            <StatCard label="Dataset entries" value={statsQuery.data.total_dataset_entries} Icon={BookOpen} />
            <StatCard label="Pending rights clearance" value={statsQuery.data.entries_pending_rights_clearance} Icon={AlertTriangle}
                      hint="Not visible to teachers/students yet" />
            <StatCard label="Feedback received" value={statsQuery.data.total_feedback} Icon={MessageSquare} />
          </div>

          {statsQuery.data.entries_pending_rights_clearance > 0 && (
            <div className="mt-6 flex items-start gap-3 rounded-card border border-warning/30 bg-warning/5 p-4">
              <AlertTriangle className="mt-0.5 shrink-0 text-warning" size={18} aria-hidden="true" />
              <p className="text-sm text-ink">
                {statsQuery.data.entries_pending_rights_clearance} dataset {statsQuery.data.entries_pending_rights_clearance === 1 ? "entry is" : "entries are"} waiting
                for a copyright/rights review before they can appear in the app -- see{" "}
                <a href="/dataset?rights_status=pending" className="font-semibold text-secondary underline">Dataset &amp; Rights</a>.
              </p>
            </div>
          )}

          <p className="mt-6 text-xs text-ink-muted">{statsQuery.data.unread_feedback_note}</p>
        </>
      )}
    </div>
  );
}
