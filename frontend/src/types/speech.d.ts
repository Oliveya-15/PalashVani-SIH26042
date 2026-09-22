/**
 * Minimal ambient types for the Web Speech API.
 *
 * TypeScript's bundled DOM lib does not ship types for SpeechRecognition /
 * SpeechSynthesis because the spec is still non-standard (Chrome/Edge only,
 * prefixed as webkitSpeechRecognition in some builds). We declare just
 * enough of the surface area PalashVani actually uses -- see
 * src/hooks/useSpeechRecognition.ts and useSpeechSynthesis.ts, which are
 * also responsible for feature-detecting these at runtime and degrading
 * gracefully when they are undefined (per the project's "never fake voice
 * functionality" requirement).
 */
export {};

declare global {
  interface SpeechRecognitionEventResultItem {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognitionResultLike {
    [index: number]: SpeechRecognitionEventResultItem;
    isFinal: boolean;
    length: number;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: {
      [index: number]: SpeechRecognitionResultLike;
      length: number;
    };
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  }

  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition };
    webkitSpeechRecognition?: { new (): SpeechRecognition };
  }
}
