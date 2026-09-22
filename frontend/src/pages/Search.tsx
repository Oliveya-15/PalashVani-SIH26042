import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Volume2, Copy, Check, BookOpen } from "lucide-react";
import { api } from "@/api/client";
import { useI18n } from "@/i18n/I18nProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import type { SearchResultItem } from "@/types";

const PAGE_SIZE = 20;

function WordDetailPanel({ word }: { word: SearchResultItem | null }) {
  const { t } = useI18n();
  const { isSupported: ttsSupported, speak } = useSpeechSynthesis();
  const [copied, setCopied] = useState(false);

  useEffect(() => setCopied(false), [word?.id]);

  if (!word) {
    return (
      <div className="card flex h-full min-h-[280px] flex-col items-center justify-center gap-2 p-6 text-center">
        <BookOpen className="text-ink-muted" size={28} aria-hidden="true" />
        <p className="text-sm text-ink-muted">{t("search.selectWordHint")}</p>
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(word.target_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-medium text-ink-muted">
          {word.category}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            word.verified ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          }`}
        >
          {word.verified ? t("search.verifiedBadge") : t("search.unverifiedBadge")}
        </span>
      </div>

      <div>
        <p className="text-sm text-ink-muted">{t("translate.sourceLabel")}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-2xl font-semibold text-ink">{word.source_text}</p>
          {ttsSupported && (
            <button
              type="button"
              onClick={() => speak(word.source_text, "hi")}
              aria-label={`${t("translate.listenBtn")}: ${word.source_text}`}
              className="rounded-full p-2 text-secondary hover:bg-surface-alt"
            >
              <Volume2 size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm text-ink-muted">{t("translate.targetLabel")}</p>
        <div className="flex items-center justify-between gap-2">
          <p lang="unr" className="font-display text-2xl font-semibold text-secondary">
            {word.target_text}
          </p>
          {ttsSupported && (
            <button
              type="button"
              onClick={() => speak(word.target_text, "hi")}
              aria-label={`${t("translate.listenBtn")}: ${word.target_text}`}
              className="rounded-full p-2 text-secondary hover:bg-surface-alt"
            >
              <Volume2 size={18} aria-hidden="true" />
            </button>
          )}
        </div>
        {word.transliteration && <p className="mt-1 text-sm italic text-ink-muted">/{word.transliteration}/</p>}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button type="button" onClick={handleCopy} className="btn-secondary !py-1.5 !px-4 text-sm">
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? t("translate.copied") : t("translate.copyBtn")}
        </button>
      </div>

      {word.source_citation && (
        <p className="text-xs text-ink-muted">
          {t("translate.sourceCitationLabel")}: {word.source_citation}
        </p>
      )}
      {ttsSupported && <p className="text-xs text-ink-muted">{t("translate.ttsApproximateNote")}</p>}
    </div>
  );
}

export default function Search() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SearchResultItem | null>(null);
  const debouncedQuery = useDebounce(query, 350);

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: api.categories });

  const searchQuery = useQuery({
    queryKey: ["search", debouncedQuery, category, page],
    queryFn: () => api.search({ q: debouncedQuery, category, page, pageSize: PAGE_SIZE }),
  });

  // Keep the detail panel showing the first result by default so the page
  // never looks like "just a list" -- there's always something in the
  // right-hand panel once results load.
  useEffect(() => {
    if (searchQuery.data?.results.length) {
      setSelected((current) =>
        current && searchQuery.data.results.some((r) => r.id === current.id) ? current : searchQuery.data.results[0],
      );
    } else {
      setSelected(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery.data]);

  const totalPages = searchQuery.data ? Math.max(1, Math.ceil(searchQuery.data.total / PAGE_SIZE)) : 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{t("search.title")}</h1>
      <p className="mt-2 text-ink-muted">{t("search.subtitle")}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} aria-hidden="true" />
          <label htmlFor="search-input" className="sr-only">{t("search.placeholder")}</label>
          <input
            id="search-input"
            type="search"
            className="field pl-10"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <label htmlFor="category-filter" className="sr-only">{t("search.categoryAll")}</label>
        <select
          id="category-filter"
          className="field sm:w-52"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">{t("search.categoryAll")}</option>
          {categoriesQuery.data?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Results list */}
        <div>
          {searchQuery.isLoading && <LoadingState label={t("search.loadingBody")} />}
          {searchQuery.isError && <ErrorState message={t("search.errorBody")} onRetry={() => searchQuery.refetch()} />}

          {searchQuery.data && (
            <>
              <p className="mb-3 text-sm text-ink-muted">
                {t("search.resultsCount", { count: searchQuery.data.total })}
              </p>

              {searchQuery.data.results.length === 0 ? (
                <EmptyState title={t("search.emptyTitle")} body={t("search.emptyBody")} />
              ) : (
                <ul className="space-y-2">
                  {searchQuery.data.results.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        aria-current={selected?.id === r.id}
                        className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-card border p-4 text-left transition-colors ${
                          selected?.id === r.id
                            ? "border-secondary bg-secondary/5"
                            : "border-border bg-surface hover:border-secondary/40"
                        }`}
                      >
                        <div>
                          <p className="text-ink">{r.source_text}</p>
                          <p lang="unr" className="font-display font-semibold text-secondary">
                            {r.target_text}
                          </p>
                        </div>
                        <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-medium text-ink-muted">
                          {r.category}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="btn-secondary !py-1.5 !px-4 text-sm disabled:opacity-40"
                  >
                    {t("search.prevPage")}
                  </button>
                  <span className="text-sm text-ink-muted">{t("search.pageInfo", { page, totalPages })}</span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-secondary !py-1.5 !px-4 text-sm disabled:opacity-40"
                  >
                    {t("search.nextPage")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Word detail panel */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <WordDetailPanel word={selected} />
        </div>
      </div>
    </div>
  );
}
