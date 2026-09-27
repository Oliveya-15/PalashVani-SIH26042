import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, ShieldCheck, ShieldAlert, Trash2, Pencil } from "lucide-react";
import { api } from "@/api/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Badge } from "@/components/Badge";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { AdminDatasetEntry, AdminDatasetEntryCreatePayload, AdminDatasetEntryUpdatePayload } from "@/types";

const EMPTY_FORM: AdminDatasetEntryCreatePayload = {
  source_text: "", target_text: "", target_language_code: "mundari", category: "general",
  transliteration: "", source_citation: "", verified: false, rights_cleared: false, rights_note: "",
};

export default function DatasetPage() {
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();

  const [rightsStatus, setRightsStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminDatasetEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminDatasetEntry | null>(null);

  const entriesQuery = useQuery({
    queryKey: ["admin-dataset", rightsStatus, search, page],
    queryFn: () => api.dataset.list(token as string, {
      rightsStatus: rightsStatus === "all" ? undefined : rightsStatus, search: search || undefined, page,
    }),
    enabled: Boolean(token),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-dataset"] });

  const createMutation = useMutation({
    mutationFn: (payload: AdminDatasetEntryCreatePayload) => api.dataset.create(token as string, payload),
    onSuccess: () => { invalidate(); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; payload: AdminDatasetEntryUpdatePayload }) =>
      api.dataset.update(token as string, vars.id, vars.payload),
    onSuccess: () => { invalidate(); setEditTarget(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.dataset.remove(token as string, id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
  });

  const toggleRights = (entry: AdminDatasetEntry) =>
    updateMutation.mutate({ id: entry.id, payload: { rights_cleared: !entry.rights_cleared } });

  const totalPages = entriesQuery.data ? Math.max(1, Math.ceil(entriesQuery.data.total / entriesQuery.data.page_size)) : 1;

  return (
    <div className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Dataset &amp; Rights</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Every dictionary entry. New entries start <strong>unpublished</strong> until you confirm the
            source citation and clear rights -- see docs/admin-notes.md "Why a rights_cleared flag".
          </p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} aria-hidden="true" /> Add entry
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} aria-hidden="true" />
          <input
            className="field pl-9" placeholder="Search Hindi or Mundari text..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="field w-48" value={rightsStatus} onChange={(e) => { setRightsStatus(e.target.value); setPage(1); }}>
          <option value="all">All entries</option>
          <option value="cleared">Rights cleared (published)</option>
          <option value="pending">Pending clearance</option>
        </select>
      </div>

      <div className="mt-6">
        {entriesQuery.isLoading && <LoadingState label="Loading dataset..." />}
        {entriesQuery.isError && <ErrorState message="Couldn't load dataset entries." onRetry={() => entriesQuery.refetch()} />}

        {entriesQuery.data && (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-semibold">Hindi</th>
                  <th className="px-4 py-3 font-semibold">Mundari</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Source citation</th>
                  <th className="px-4 py-3 font-semibold">Rights</th>
                  <th className="px-4 py-3 font-semibold sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entriesQuery.data.entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-ink">{entry.source_text}</td>
                    <td className="px-4 py-3 font-display font-semibold text-secondary">{entry.target_text}</td>
                    <td className="px-4 py-3"><Badge tone="neutral">{entry.category}</Badge></td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-ink-muted" title={entry.source_citation}>
                      {entry.source_citation}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleRights(entry)}
                        className={`flex items-center gap-1.5 text-xs font-semibold hover:underline ${entry.rights_cleared ? "text-success" : "text-warning"}`}
                        title="Click to toggle"
                      >
                        {entry.rights_cleared ? <ShieldCheck size={14} aria-hidden="true" /> : <ShieldAlert size={14} aria-hidden="true" />}
                        {entry.rights_cleared ? "Cleared" : "Pending"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setEditTarget(entry)} aria-label="Edit" className="text-secondary hover:opacity-70">
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(entry)} aria-label="Delete" className="text-danger hover:opacity-70">
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {entriesQuery.data && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
      </div>

      {showCreate && (
        <Modal title="Add a dataset entry" onClose={() => setShowCreate(false)} wide>
          <EntryForm
            initial={EMPTY_FORM}
            onSave={(payload) => createMutation.mutate(payload)}
            saving={createMutation.isPending}
            submitLabel="Add entry"
          />
        </Modal>
      )}

      {editTarget && (
        <Modal title="Edit entry" onClose={() => setEditTarget(null)} wide>
          <EntryForm
            initial={editTarget}
            onSave={(payload) => updateMutation.mutate({ id: editTarget.id, payload })}
            saving={updateMutation.isPending}
            submitLabel="Save changes"
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this entry?"
          body={`"${deleteTarget.source_text}" -> "${deleteTarget.target_text}" will be permanently removed, including from any curriculum chapter it's linked to.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function EntryForm({
  initial, onSave, saving, submitLabel,
}: {
  initial: AdminDatasetEntryCreatePayload | AdminDatasetEntry;
  onSave: (payload: AdminDatasetEntryCreatePayload) => void;
  saving: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState<AdminDatasetEntryCreatePayload>({
    source_text: initial.source_text,
    target_text: initial.target_text,
    target_language_code: "target_language_code" in initial ? initial.target_language_code : "mundari",
    category: initial.category,
    transliteration: initial.transliteration,
    source_citation: initial.source_citation,
    verified: "verified" in initial ? initial.verified : false,
    rights_cleared: "rights_cleared" in initial ? initial.rights_cleared : false,
    rights_note: "rights_note" in initial ? initial.rights_note : "",
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Hindi text</label>
          <input required className="field" value={form.source_text}
                 onChange={(e) => setForm((f) => ({ ...f, source_text: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Mundari text</label>
          <input required className="field" value={form.target_text}
                 onChange={(e) => setForm((f) => ({ ...f, target_text: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Category</label>
          <input className="field" value={form.category}
                 onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Transliteration</label>
          <input className="field" value={form.transliteration}
                 onChange={(e) => setForm((f) => ({ ...f, transliteration: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">Source citation (required)</label>
        <input required className="field" placeholder="e.g. mundariversity.com -- Colour Names in Mundari"
               value={form.source_citation} onChange={(e) => setForm((f) => ({ ...f, source_citation: e.target.value }))} />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.verified} onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))} />
          Verified (checked against the cited source)
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.rights_cleared} onChange={(e) => setForm((f) => ({ ...f, rights_cleared: e.target.checked }))} />
          Rights cleared (publish to the live app)
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">Rights note (optional)</label>
        <input className="field" placeholder="e.g. Licensed CC-BY-4.0 via StoryWeaver, cleared 2026-09-27"
               value={form.rights_note} onChange={(e) => setForm((f) => ({ ...f, rights_note: e.target.value }))} />
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
