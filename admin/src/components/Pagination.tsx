interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="btn-secondary text-sm disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-ink-muted">Page {page} of {totalPages}</span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="btn-secondary text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
