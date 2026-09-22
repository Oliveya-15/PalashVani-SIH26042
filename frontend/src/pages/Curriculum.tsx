import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { api } from "@/api/client";
import { useI18n } from "@/i18n/I18nProvider";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

export default function Curriculum() {
  const { t, language } = useI18n();
  const gradesQuery = useQuery({ queryKey: ["curriculum-grades"], queryFn: api.curriculumGrades });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{t("curriculum.title")}</h1>
      <p className="mt-2 text-ink-muted">{t("curriculum.subtitle")}</p>
      <p className="mt-3 rounded-xl bg-surface-alt p-3 text-sm text-ink-muted">
        {t("curriculum.note")}
      </p>

      <div className="mt-8">
        {gradesQuery.isLoading && <LoadingState label={t("curriculum.loadingBody")} />}
        {gradesQuery.isError && <ErrorState message={t("common.error")} onRetry={() => gradesQuery.refetch()} />}

        {gradesQuery.data && (
          <div className="space-y-8">
            {gradesQuery.data
              .filter((g) => g.subjects.some((s) => s.chapters.length > 0))
              .map((grade) => (
                <section key={grade.id}>
                  <h2 className="font-display text-xl font-bold text-secondary">
                    {language === "hi" ? grade.label_hi : grade.label_en}
                  </h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {grade.subjects
                      .filter((s) => s.chapters.length > 0)
                      .map((subject) => (
                        <div key={subject.id} className="card p-4">
                          <p className="flex items-center gap-2 font-display font-semibold text-ink">
                            <span aria-hidden="true">{subject.icon}</span>
                            {language === "hi" ? subject.name_hi : subject.name_en}
                          </p>
                          <ul className="mt-2 space-y-1">
                            {subject.chapters.map((chapter) => (
                              <li key={chapter.id}>
                                <Link
                                  to={`/curriculum/chapters/${chapter.id}`}
                                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-alt hover:text-secondary"
                                >
                                  <span>
                                    {language === "hi" ? chapter.title_hi : chapter.title_en}
                                    <span className="ml-2 text-xs text-ink-muted">
                                      {t("curriculum.unitCount", { count: chapter.unit_count })}
                                    </span>
                                  </span>
                                  <ChevronRight size={16} aria-hidden="true" />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                  </div>
                </section>
              ))}

            {gradesQuery.data.every((g) => g.subjects.every((s) => s.chapters.length === 0)) && (
              <EmptyState title={t("search.emptyTitle")} body={t("curriculum.emptyBody")} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
