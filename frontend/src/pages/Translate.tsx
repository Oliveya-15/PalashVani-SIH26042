import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Loader2, ScanLine, Type as TypeIcon, Mic as MicIcon, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "@/api/client";
import { useI18n } from "@/i18n/I18nProvider";
import { VoiceButton } from "@/components/VoiceButton";
import { TranslationCard } from "@/components/TranslationCard";
import { ErrorState } from "@/components/ErrorState";
import { charCount, wordCount } from "@/utils/format";
import type { TranslateResponse } from "@/types";

type Mode = "type" | "voice" | "scan";
type Direction = { source: string; target: string };

const EXAMPLES = ["नमस्ते", "आप कैसे हैं?", "एक", "गाय", "सफ़ेद"];

// Devanagari block (U+0900-U+097F) + whitespace + common sentence
// punctuation. Scanned classroom photos often pick up stray noise (page
// numbers, watermarks, JPEG artefacts) as garbled Latin letters or digits
// -- since this app only ever translates Hindi/Devanagari text, anything
// outside this set is almost certainly OCR noise, not real content, so we
// strip it rather than silently feeding a mangled query into the
// translator (this is exactly what caused a stray "8856" to be appended
// after a scanned "नमस्ते" and produce a false "no match" result).
function cleanOcrText(raw: string): string {
  return raw
    .replace(/[^\u0900-\u097F\s।॥?!.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function Translate() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("type");
  const [direction, setDirection] = useState<Direction>({ source: "hi", target: "mundari" });
  const [text, setText] = useState("");
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "unsupported" | "empty">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Revoke the previous object URL whenever it's replaced or the page
    // unmounts, so repeated scans don't leak memory.
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const mutation = useMutation<TranslateResponse, ApiError, void>({
    mutationFn: () => api.translate(text, direction.source, direction.target),
  });

  const isReversed = direction.source !== "hi";
  const sourceLabel = isReversed ? t("translate.targetLabel") : t("translate.sourceLabel");
  const targetLabel = isReversed ? t("translate.sourceLabel") : t("translate.targetLabel");

  const handleSwap = () => {
    setDirection((d) => ({ source: d.target, target: d.source }));
    setText("");
    mutation.reset();
  };

  const handleTranslate = useCallback(() => {
    if (!text.trim()) return;
    mutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, direction]);

  const handleScanFile = async (file: File) => {
    setScanStatus("scanning");
    setPreviewUrl(URL.createObjectURL(file));
    try {
      // Loaded lazily so the main bundle stays small for low-end classroom
      // devices -- see the "code splitting" performance requirement.
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("hin");
      const {
        data: { text: extracted },
      } = await worker.recognize(file);
      await worker.terminate();
      const cleaned = cleanOcrText(extracted);
      setText(cleaned);
      setScanStatus(cleaned ? "idle" : "empty");
    } catch {
      setScanStatus("unsupported");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{t("translate.title")}</h1>
      <p className="mt-2 text-ink-muted">{t("translate.subtitle")}</p>

      {/* Mode tabs */}
      <div className="mt-6 inline-flex rounded-full border border-border bg-white p-1" role="tablist">
        {([
          { id: "type", label: t("translate.typeTab"), Icon: TypeIcon },
          { id: "voice", label: t("translate.voiceTab"), Icon: MicIcon },
          { id: "scan", label: t("translate.scanTab"), Icon: ScanLine },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              mode === id ? "bg-secondary text-white" : "text-ink-muted hover:text-secondary"
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Direction indicator + swap */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <span className="rounded-full bg-surface-alt px-4 py-1.5 text-sm font-semibold text-ink">
          {sourceLabel}
        </span>
        <button
          type="button"
          onClick={handleSwap}
          aria-label={t("translate.swapBtn")}
          title={t("translate.swapBtn")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-secondary hover:bg-surface-alt"
        >
          <ArrowLeftRight size={16} aria-hidden="true" />
        </button>
        <span className="rounded-full bg-surface-alt px-4 py-1.5 text-sm font-semibold text-ink">
          {targetLabel}
        </span>
      </div>

      {/* Input area */}
      <div className="mt-6 space-y-3">
        {mode === "voice" && (
          <VoiceButton lang={isReversed ? "en-IN" : "hi-IN"} onResult={(transcript) => setText(transcript)} />
        )}

        {mode === "scan" && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleScanFile(file);
              }}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary">
              <ScanLine size={18} aria-hidden="true" />
              {t("translate.uploadImage")}
            </button>

            {previewUrl && (
              <img
                src={previewUrl}
                alt=""
                className="h-32 w-auto rounded-lg border border-border object-cover"
              />
            )}

            {scanStatus === "scanning" && (
              <p className="flex items-center gap-2 text-sm text-ink-muted" role="status" aria-live="polite">
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                {t("translate.scanning")}
              </p>
            )}
            {scanStatus === "unsupported" && <p className="text-sm text-warning">{t("translate.scanUnsupported")}</p>}
            {scanStatus === "empty" && <p className="text-sm text-warning">{t("translate.extractedTextEmpty")}</p>}
            {scanStatus === "idle" && text && (
              <p className="text-xs text-ink-muted">
                {t("translate.extractedTextLabel")} — {t("translate.reviewEditHint")}
              </p>
            )}
          </div>
        )}

        <div className="relative">
          <label htmlFor="translate-input" className="sr-only">
            {sourceLabel}
          </label>
          <textarea
            id="translate-input"
            className="field min-h-[120px] resize-y pr-10"
            placeholder={t("translate.inputPlaceholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            lang={isReversed ? "unr" : "hi"}
          />
          {text && (
            <button
              type="button"
              onClick={() => {
                setText("");
                setPreviewUrl(null);
                setScanStatus("idle");
              }}
              aria-label={t("translate.clearBtn")}
              className="absolute right-3 top-3 text-ink-muted hover:text-ink"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>{t("translate.charCount", { count: charCount(text) })} · {t("translate.wordCount", { count: wordCount(text) })}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-ink-muted">{t("translate.tryExampleLabel")}</p>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              className="rounded-full border border-border px-3 py-1 text-sm text-ink hover:border-secondary hover:text-secondary"
            >
              {ex}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleTranslate}
          disabled={!text.trim() || mutation.isPending}
          className="btn-primary w-full sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="animate-spin" size={18} aria-hidden="true" />}
          {t("translate.translateBtn")}
        </button>
      </div>

      {/* Result */}
      <div className="mt-8">
        {mutation.isError && (
          <ErrorState message={mutation.error?.message ?? t("common.error")} onRetry={() => mutation.mutate()} />
        )}
        {mutation.isSuccess && <TranslationCard result={mutation.data} />}
      </div>
    </div>
  );
}
