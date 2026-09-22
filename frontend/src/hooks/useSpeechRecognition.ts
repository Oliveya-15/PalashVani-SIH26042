import { useCallback, useEffect, useRef, useState } from "react";

export type MicStatus = "idle" | "listening" | "processing" | "unsupported" | "denied" | "error";

interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult: (transcript: string) => void;
}

/**
 * Thin wrapper around the browser's SpeechRecognition API.
 *
 * Per the project's "never fake voice functionality" rule, this hook does
 * real feature detection (`isSupported`) instead of always rendering an
 * active-looking mic button, and surfaces every real state the Web Speech
 * API can produce (listening / processing / unsupported / permission
 * denied / error) so the UI never lies about what's happening.
 */
export function useSpeechRecognition({ lang = "hi-IN", onResult }: UseSpeechRecognitionOptions) {
  const [status, setStatus] = useState<MicStatus>("idle");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!isSupported) {
      setStatus("unsupported");
    }
  }, [isSupported]);

  const start = useCallback(() => {
    if (!isSupported) {
      setStatus("unsupported");
      return;
    }
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setStatus("unsupported");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStatus("listening");
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      setStatus("processing");
      const transcript = event.results[event.resultIndex]?.[0]?.transcript ?? "";
      onResult(transcript);
      setStatus("idle");
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setStatus(event.error === "not-allowed" || event.error === "permission-denied" ? "denied" : "error");
    };
    recognition.onend = () => {
      setStatus((current) => (current === "listening" ? "idle" : current));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, lang, onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus("idle");
  }, []);

  return { status, isSupported, start, stop };
}
