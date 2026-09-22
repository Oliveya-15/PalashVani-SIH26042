import { Mic, MicOff, AlertCircle } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface VoiceButtonProps {
  lang?: string;
  onResult: (transcript: string) => void;
}

export function VoiceButton({ lang = "hi-IN", onResult }: VoiceButtonProps) {
  const { t } = useI18n();
  const { status, isSupported, start, stop } = useSpeechRecognition({ lang, onResult });

  if (!isSupported) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning">
        <AlertCircle size={16} aria-hidden="true" />
        {t("translate.micUnsupported")}
      </p>
    );
  }

  const isListening = status === "listening";

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={isListening ? stop : start}
        aria-pressed={isListening}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition-colors ${
          isListening ? "bg-danger text-white" : "bg-secondary text-white hover:bg-secondary-light"
        }`}
      >
        {isListening ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
        {isListening ? t("translate.micStop") : t("translate.micBtn")}
      </button>

      <p className="text-sm" role="status" aria-live="polite">
        {status === "listening" && <span className="text-secondary">{t("translate.micListening")}</span>}
        {status === "denied" && <span className="text-danger">{t("translate.micPermissionDenied")}</span>}
        {status === "error" && <span className="text-danger">{t("common.error")}</span>}
      </p>
    </div>
  );
}
