import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Volume2 } from "lucide-react";
import { api } from "@/api/client";
import { useI18n } from "@/i18n/I18nProvider";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";

export default function ChapterDetail() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { t, language } = useI18n();
  const { isSupported: ttsSupported, speak } = useSpeechSynthesis();

  const chapterQuery = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () => api.chapterDetail(Number(chapterId)),
    enabled: Boolean(chapterId),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/curriculum" className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary">
        <ArrowLeft size={16} aria-hidden="true" />
        {t("curriculum.backToGrades")}
      </Link>

      {chapterQuery.isLoading && (
        <div className="mt-6">
          <LoadingState label={t("curriculum.loadingBody")} />
        </div>
      )}
      {chapterQuery.isError && (
        <div className="mt-6">
          <ErrorState message={t("common.error")} onRetry={() => chapterQuery.refetch()} />
        </div>
      )}

      {chapterQuery.data && (
        <>
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">
            {language === "hi" ? chapterQuery.data.title_hi : chapterQuery.data.title_en}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {chapterQuery.data.subject_name_en} · Grade {chapterQuery.data.grade_number}
          </p>

          <div className="mt-6 overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[480px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface-alt text-sm text-ink-muted">
                  <th scope="col" className="px-4 py-3 font-semibold">{t("curriculum.sourceCol")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("curriculum.targetCol")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("curriculum.pronunciationCol")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold sr-only">{t("curriculum.playAudio")}</th>
                </tr>
              </thead>
              <tbody>
                {chapterQuery.data.units.map((unit) => (
                  <tr key={unit.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-ink">{unit.source_text}</td>
                    <td lang="unr" className="px-4 py-3 font-display font-semibold text-secondary">
                      {unit.target_text}
                    </td>
                    <td className="px-4 py-3 text-sm italic text-ink-muted">
                      {unit.transliteration ? `/${unit.transliteration}/` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ttsSupported && (
                        <button
                          type="button"
                          onClick={() => speak(unit.target_text, "hi")}
                          aria-label={`${t("curriculum.playAudio")}: ${unit.target_text}`}
                          className="rounded-full p-2 text-secondary hover:bg-surface-alt"
                        >
                          <Volume2 size={16} aria-hidden="true" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
