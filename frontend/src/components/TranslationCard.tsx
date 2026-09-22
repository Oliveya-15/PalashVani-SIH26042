import { useState } from "react";
import { Copy, Check, Volume2, Info } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import type { TranslateResponse } from "@/types";

const METHOD_LABEL_KEYS: Record<string, string> = {
  exact: "translate.methodExact",
  normalized: "translate.methodExact",
  fuzzy: "translate.methodFuzzy",
  semantic: "translate.methodSemantic",
  external_bhashini: "translate.methodSemantic",
  none: "translate.methodNone",
};

export function TranslationCard({ result }: { result: TranslateResponse }) {
  const { t } = useI18n();
  const { isSupported: ttsSupported, speak } = useSpeechSynthesis();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result.result_text) return;
    await navigator.clipboard.writeText(result.result_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {t(METHOD_LABEL_KEYS[result.method] ?? "translate.methodNone")}
        </span>
        <ConfidenceBadge label={result.confidence_label} />
      </div>

      {result.result_text ? (
        <p lang="unr" className="font-display text-2xl font-semibold text-secondary">
          {result.result_text}
        </p>
      ) : (
        <p className="text-ink-muted">{t("translate.noResultYet")}</p>
      )}

      {result.transliteration && (
        <p className="text-sm italic text-ink-muted">/{result.transliteration}/</p>
      )}

      <p className="text-sm text-ink-muted">{result.message}</p>

      {result.ai_assisted && (
        <p className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm text-warning">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t("translate.aiAssistedLabel")}
        </p>
      )}

      {result.result_text && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleCopy} className="btn-secondary !py-1.5 !px-4 text-sm">
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? t("translate.copied") : t("translate.copyBtn")}
          </button>
          {ttsSupported && (
            <button
              type="button"
              onClick={() => speak(result.result_text as string, "hi")}
              className="btn-secondary !py-1.5 !px-4 text-sm"
            >
              <Volume2 size={16} aria-hidden="true" />
              {t("translate.listenBtn")}
            </button>
          )}
        </div>
      )}

      {result.result_text && (
        <p className="text-xs text-ink-muted">{t("translate.ttsApproximateNote")}</p>
      )}

      {result.source_citation && (
        <p className="text-xs text-ink-muted">
          {t("translate.sourceCitationLabel")}: {result.source_citation}
        </p>
      )}

      {result.alternatives.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t("translate.alternativesLabel")}
          </p>
          <ul className="space-y-1">
            {result.alternatives.map((alt, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span lang="unr">{alt.text}</span>
                <span className="text-ink-muted">{Math.round(alt.similarity * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
