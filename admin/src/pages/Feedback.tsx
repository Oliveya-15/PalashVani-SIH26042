import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { api } from "@/api/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { formatDateTime } from "@/utils/format";

export default function FeedbackPage() {
  const { token } = useAdminAuth();
  const [page, setPage] = useState(1);

  const feedbackQuery = useQuery({
    queryKey: ["admin-feedback", page],
    queryFn: () => api.dashboard.feedback(token as string, page),
    enabled: Boolean(token),
  });

  const totalPages = feedbackQuery.data ? Math.max(1, Math.ceil(feedbackQuery.data.total / feedbackQuery.data.page_size)) : 1;

  return (
    <div className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink">Feedback</h1>
      <p className="mt-1 text-sm text-ink-muted">Every submission, newest first, attributed to the account that sent it.</p>

      <div className="mt-6">
        {feedbackQuery.isLoading && <LoadingState label="Loading feedback..." />}
        {feedbackQuery.isError && <ErrorState message="Couldn't load feedback." onRetry={() => feedbackQuery.refetch()} />}

        {feedbackQuery.data && feedbackQuery.data.items.length === 0 && (
          <EmptyState title="No feedback yet" body="Submissions from the Feedback page will show up here." />
        )}

        {feedbackQuery.data && feedbackQuery.data.items.length > 0 && (
          <ul className="space-y-3">
            {feedbackQuery.data.items.map((item) => (
              <li key={item.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">
                    {item.user_full_name || "Unknown user"}
                    {item.user_email && <span className="ml-2 font-normal text-ink-muted">{item.user_email}</span>}
                  </p>
                  <span className="text-xs text-ink-muted">{formatDateTime(item.created_at)} · {item.page}</span>
                </div>
                <p className="mt-2 text-sm text-ink">{item.message}</p>
                {item.rating && (
                  <p className="mt-2 flex items-center gap-1 text-warning">
                    {Array.from({ length: item.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" aria-hidden="true" />)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {feedbackQuery.data && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
      </div>
    </div>
  );
}
