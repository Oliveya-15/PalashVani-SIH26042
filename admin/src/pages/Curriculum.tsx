import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { api } from "@/api/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Chapter { id: number; title_en: string; title_hi: string; order_index: number; unit_count: number }
interface Subject { id: number; name_en: string; name_hi: string; icon: string; chapters: Chapter[] }
interface Grade { id: number; grade_number: number; label_en: string; subjects: Subject[] }

export default function CurriculumPage() {
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();

  const gradesQuery = useQuery({
    queryKey: ["admin-curriculum-grades"],
    queryFn: () => api.curriculum.grades(token as string) as Promise<Grade[]>,
    enabled: Boolean(token),
  });

  const [addingToSubject, setAddingToSubject] = useState<Subject | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-curriculum-grades"] });

  const createChapter = useMutation({
    mutationFn: (payload: { subject_id: number; title_en: string; title_hi: string; order_index: number }) =>
      api.curriculum.createChapter(token as string, payload),
    onSuccess: () => { invalidate(); setAddingToSubject(null); },
  });

  const updateChapter = useMutation({
    mutationFn: (vars: { id: number; title_en: string; title_hi: string }) =>
      api.curriculum.updateChapter(token as string, vars.id, { title_en: vars.title_en, title_hi: vars.title_hi }),
    onSuccess: () => { invalidate(); setEditingChapter(null); },
  });

  const deleteChapter = useMutation({
    mutationFn: (id: number) => api.curriculum.deleteChapter(token as string, id),
    onSuccess: () => { invalidate(); setDeletingChapter(null); },
  });

  return (
    <div className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink">Curriculum</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Grade → Subject → Chapter structure. Adding/removing chapters here doesn't delete the underlying
        dictionary entries -- it only changes how they're organised for classroom browsing.
      </p>

      {gradesQuery.isLoading && <LoadingState label="Loading curriculum..." />}
      {gradesQuery.isError && <ErrorState message="Couldn't load curriculum." onRetry={() => gradesQuery.refetch()} />}

      {gradesQuery.data && (
        <div className="mt-6 space-y-6">
          {gradesQuery.data.map((grade) => (
            <section key={grade.id} className="card p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-secondary">
                <GraduationCap size={18} aria-hidden="true" /> {grade.label_en}
              </h2>
              <div className="mt-3 space-y-4">
                {grade.subjects.map((subject) => (
                  <div key={subject.id}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-ink">{subject.icon} {subject.name_en}</p>
                      <button
                        type="button"
                        onClick={() => setAddingToSubject(subject)}
                        className="flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
                      >
                        <Plus size={14} aria-hidden="true" /> Add chapter
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {subject.chapters.map((chapter) => (
                        <li key={chapter.id} className="flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2 text-sm">
                          <span>{chapter.title_en} <span className="text-xs text-ink-muted">({chapter.unit_count} phrases)</span></span>
                          <span className="flex items-center gap-3">
                            <button type="button" onClick={() => setEditingChapter(chapter)} aria-label="Edit chapter" className="text-secondary hover:opacity-70">
                              <Pencil size={14} aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => setDeletingChapter(chapter)} aria-label="Delete chapter" className="text-danger hover:opacity-70">
                              <Trash2 size={14} aria-hidden="true" />
                            </button>
                          </span>
                        </li>
                      ))}
                      {subject.chapters.length === 0 && <li className="text-sm text-ink-muted">No chapters yet.</li>}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {addingToSubject && (
        <Modal title={`Add chapter to ${addingToSubject.name_en}`} onClose={() => setAddingToSubject(null)}>
          <ChapterForm
            onSave={(title_en, title_hi) => createChapter.mutate({
              subject_id: addingToSubject.id, title_en, title_hi, order_index: addingToSubject.chapters.length,
            })}
            saving={createChapter.isPending}
          />
        </Modal>
      )}

      {editingChapter && (
        <Modal title="Edit chapter" onClose={() => setEditingChapter(null)}>
          <ChapterForm
            initialEn={editingChapter.title_en}
            initialHi={editingChapter.title_hi}
            onSave={(title_en, title_hi) => updateChapter.mutate({ id: editingChapter.id, title_en, title_hi })}
            saving={updateChapter.isPending}
          />
        </Modal>
      )}

      {deletingChapter && (
        <ConfirmDialog
          title="Delete this chapter?"
          body={`"${deletingChapter.title_en}" will be removed. Its ${deletingChapter.unit_count} linked phrases stay in the dataset -- they'll just become unlinked from any chapter.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteChapter.mutate(deletingChapter.id)}
          onCancel={() => setDeletingChapter(null)}
        />
      )}
    </div>
  );
}

function ChapterForm({
  initialEn = "", initialHi = "", onSave, saving,
}: {
  initialEn?: string; initialHi?: string; onSave: (titleEn: string, titleHi: string) => void; saving: boolean;
}) {
  const [titleEn, setTitleEn] = useState(initialEn);
  const [titleHi, setTitleHi] = useState(initialHi);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(titleEn, titleHi); }} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">Title (English)</label>
        <input required className="field" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">Title (Hindi)</label>
        <input required className="field" value={titleHi} onChange={(e) => setTitleHi(e.target.value)} />
      </div>
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
