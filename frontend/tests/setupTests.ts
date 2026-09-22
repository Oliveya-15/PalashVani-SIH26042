import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement the Web Speech API or matchMedia -- stub them so
// components that feature-detect these (VoiceButton, ThemeToggle, etc.)
// don't crash during tests. Real behaviour is exercised manually/in the
// browser; these tests focus on rendering + interaction logic.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  value: {
    getVoices: () => [],
    speak: () => {},
    cancel: () => {},
    onvoiceschanged: null,
  },
});
