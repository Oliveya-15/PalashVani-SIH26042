import { useCallback, useEffect, useState } from "react";

/**
 * Thin wrapper around the browser's SpeechSynthesis (text-to-speech) API.
 *
 * Honesty note (see docs/ai-pipeline.md and About & Confidence page): no
 * browser ships a dedicated Mundari voice. When speaking Mundari text this
 * hook picks the closest available Devanagari-capable voice (typically a
 * Hindi voice) and the UI must label the result as an approximation --
 * see the `ttsApproximateNote` i18n string used by TranslationCard. This
 * hook never pretends to speak a language the browser can't actually
 * render; `isSupported` reflects real capability, not wishful thinking.
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!isSupported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  const pickVoice = useCallback(
    (preferredLangPrefix: string) => voices.find((v) => v.lang.toLowerCase().startsWith(preferredLangPrefix)),
    [voices],
  );

  const speak = useCallback(
    (text: string, preferredLangPrefix = "hi") => {
      if (!isSupported || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(preferredLangPrefix);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? `${preferredLangPrefix}-IN`;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, pickVoice],
  );

  const cancel = useCallback(() => {
    if (isSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSupported, isSpeaking, speak, cancel };
}
