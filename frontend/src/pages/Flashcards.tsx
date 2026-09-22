import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RotateCw, Shuffle, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { api } from "@/api/client";
import { useI18n } from "@/i18n/I18nProvider";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";

export default function Flashcards() {
  const { t } = useI18n();
  const { isSupported: ttsSupported, speak } = useSpeechSynthesis();
  const [category, setCategory] = useState<string>("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const categoriesQuery = useQuery({ queryKey: ["flashcard-categories"], queryFn: api.flashcardCategories });

  useEffect(() => {
    if (!category && categoriesQuery.data?.length) setCategory(categoriesQuery.data[0]);
  }, [category, categoriesQuery.data]);

  const deckQuery = useQuery({
    queryKey: ["flashcard-deck", category],
    queryFn: () => api.flashcardDeck(category),
    enabled: Boolean(category),
  });

  const cards = deckQuery.data?.cards ?? [];
  const current = cards[index];

  const goTo = (newIndex: number) => {
    setFlipped(false);
    setIndex(((newIndex % cards.length) + cards.length) % cards.length);
  };

  const shuffle = () => {
    setFlipped(false);
    setIndex(Math.floor(Math.random() * cards.length));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{t("flashcards.title")}</h1>
      <p className="mt-2 text-ink-muted">{t("flashcards.subtitle")}</p>

      <div className="mt-6">
        <label htmlFor="flashcard-category" className="mb-1 block text-sm font-semibold text-ink">
          {t("flashcards.chooseCategory")}
        </label>
        <select
          id="flashcard-category"
          className="field sm:w-64"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setIndex(0);
            setFlipped(false);
          }}
        >
          {categoriesQuery.data?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8">
        {deckQuery.isLoading && <LoadingState label={t("common.loading")} />}

        {cards.length === 0 && !deckQuery.isLoading && (
          <EmptyState title={t("flashcards.noCards")} body="" />
        )}

        {current && (
          <div className="flex flex-col items-center">
            <p className="mb-3 text-sm text-ink-muted">
              {t("flashcards.cardOf", { current: index + 1, total: cards.length })}
            </p>

            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              aria-label={t("flashcards.flip")}
              className="card flex h-56 w-full max-w-sm items-center justify-center p-6 text-center transition-transform hover:scale-[1.02]"
            >
              {!flipped ? (
                <span className="font-display text-3xl font-semibold text-ink">{current.source_text}</span>
              ) : (
                <span className="flex flex-col items-center gap-2">
                  <span lang="unr" className="font-display text-3xl font-semibold text-secondary">
                    {current.target_text}
                  </span>
                  {current.transliteration && (
                    <span className="text-sm italic text-ink-muted">/{current.transliteration}/</span>
                  )}
                </span>
              )}
            </button>
            <p className="mt-2 text-xs text-ink-muted">{t("flashcards.tapToFlip")}</p>

            {ttsSupported && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speak(current.source_text, "hi")}
                  className="btn-secondary !py-1.5 !px-3 text-sm"
                >
                  <Volume2 size={14} aria-hidden="true" />
                  {t("flashcards.listenHindi")}
                </button>
                <button
                  type="button"
                  onClick={() => speak(current.target_text, "hi")}
                  className="btn-secondary !py-1.5 !px-3 text-sm"
                >
                  <Volume2 size={14} aria-hidden="true" />
                  {t("flashcards.listenMundari")}
                </button>
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button type="button" onClick={() => goTo(index - 1)} aria-label={t("flashcards.prev")} className="btn-secondary !p-2.5">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setFlipped((f) => !f)} aria-label={t("flashcards.flip")} className="btn-secondary !p-2.5">
                <RotateCw size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={shuffle} aria-label={t("flashcards.shuffle")} className="btn-secondary !p-2.5">
                <Shuffle size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => goTo(index + 1)} aria-label={t("flashcards.next")} className="btn-secondary !p-2.5">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
