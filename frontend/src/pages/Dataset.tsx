import { useQuery } from "@tanstack/react-query";
import { Download, HardDriveDownload, Trash2, CheckCircle2 } from "lucide-react";
import { api } from "@/api/client";
import { useI18n } from "@/i18n/I18nProvider";
import { useOfflineCache } from "@/hooks/useOfflineCache";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { formatDate } from "@/utils/format";

export default function Dataset() {
  const { t, language } = useI18n();
  const statsQuery = useQuery({ queryKey: ["dataset-stats"], queryFn: api.datasetStats });
  const { isSupported: offlineSupported, cachedCategories, downloading, downloadCategory, clearAll } = useOfflineCache();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{t("dataset.title")}</h1>
      <p className="mt-2 text-ink-muted">{t("dataset.subtitle")}</p>

      {statsQuery.isLoading && (
        <div className="mt-6">
          <LoadingState label={t("dataset.loadingBody")} />
        </div>
      )}
      {statsQuery.isError && (
        <div className="mt-6">
          <ErrorState message={t("common.error")} onRetry={() => statsQuery.refetch()} />
        </div>
      )}

      {statsQuery.data && (
        <>
          <div className="mt-6 card p-5">
            <p className="text-sm text-ink-muted">{t("dataset.totalVerifiedPairs")}</p>
            <p className="font-display text-4xl font-bold text-primary">{statsQuery.data.total_verified_pairs}</p>
          </div>

          <section className="mt-8">
            <h2 className="font-display text-xl font-bold text-ink">{t("dataset.perLanguageTitle")}</h2>
            <div className="mt-3 space-y-3">
              {statsQuery.data.languages.map((lang) => (
                <div key={lang.language_code} className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display font-semibold text-ink">
                      {language === "hi" ? lang.language_name_hi : lang.language_name_en}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        lang.status === "active" ? "bg-success/10 text-success" : "bg-ink-muted/10 text-ink-muted"
                      }`}
                    >
                      {lang.status === "active" ? t("common.active") : t("common.planned")}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-secondary">{lang.total_pairs}</p>
                  {lang.source && (
                    <p className="mt-1 text-xs text-ink-muted">
                      {t("dataset.sourceLabel")}: {lang.source}
                    </p>
                  )}
                  {lang.license && (
                    <p className="text-xs text-ink-muted">
                      {t("dataset.licenseLabel")}: {lang.license}
                    </p>
                  )}
                  {lang.coverage_note && (
                    <p className="mt-1 text-xs italic text-ink-muted">{lang.coverage_note}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-muted">
                    {t("dataset.lastUpdated")}: {formatDate(lang.last_updated, language)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl font-bold text-ink">{t("dataset.categoryBreakdownTitle")}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {Object.entries(statsQuery.data.category_breakdown).map(([category, count]) => (
                <li key={category} className="rounded-full border border-border px-3 py-1.5 text-sm">
                  <span className="font-semibold text-ink">{category}</span>{" "}
                  <span className="text-ink-muted">× {count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl font-bold text-ink">{t("dataset.offlineTitle")}</h2>
            <p className="mt-1 text-sm text-ink-muted">{t("dataset.offlineSubtitle")}</p>
            <p className="mt-1 text-xs text-ink-muted">{t("dataset.downloadHint")}</p>

            {!offlineSupported ? (
              <p className="mt-3 text-sm text-warning">{t("translate.scanUnsupported")}</p>
            ) : (
              <>
                <div className="mt-4 space-y-2">
                  {Object.keys(statsQuery.data.category_breakdown).map((category) => {
                    const isCached = cachedCategories.includes(category);
                    const isDownloading = downloading === category;
                    return (
                      <div key={category} className="card flex items-center justify-between p-3">
                        <span className="font-medium text-ink">{category}</span>
                        <div className="flex items-center gap-2">
                          {isCached && (
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
                              <CheckCircle2 size={16} aria-hidden="true" />
                              {t("dataset.availableOffline")}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => downloadCategory(category)}
                            disabled={isDownloading}
                            className="btn-secondary !py-1.5 !px-3 text-sm"
                          >
                            <Download size={14} aria-hidden="true" />
                            {isDownloading ? t("dataset.downloading") : t("dataset.downloadForOffline")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {cachedCategories.length > 0 && (
                  <button type="button" onClick={clearAll} className="mt-4 inline-flex items-center gap-1.5 text-sm text-danger">
                    <Trash2 size={14} aria-hidden="true" />
                    {t("dataset.clearOfflineData")}
                  </button>
                )}

                <p className="mt-4 flex items-start gap-2 text-xs text-ink-muted">
                  <HardDriveDownload size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {t("dataset.offlineSubtitle")}
                </p>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
