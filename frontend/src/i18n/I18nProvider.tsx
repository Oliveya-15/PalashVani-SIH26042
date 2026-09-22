import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import en from "@/i18n/en.json";
import hi from "@/i18n/hi.json";
import type { UiLanguage } from "@/types";

type Dictionary = typeof en;

const DICTIONARIES: Record<UiLanguage, Dictionary> = { en, hi };
const STORAGE_KEY = "palashvani.uiLanguage";

interface I18nContextValue {
  language: UiLanguage;
  setLanguage: (lang: UiLanguage) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveKey(dict: Dictionary, key: string): string | undefined {
  const parts = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = dict;
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars[name] ?? `{{${name}}}`));
}

function detectInitialLanguage(): UiLanguage {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "hi") return stored;
  return navigator.language?.toLowerCase().startsWith("hi") ? "hi" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>(detectInitialLanguage);

  const setLanguage = useCallback((lang: UiLanguage) => {
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTIONARIES[language];
      const value = resolveKey(dict, key) ?? resolveKey(DICTIONARIES.en, key);
      if (value === undefined) {
        // Fail loudly in dev rather than showing raw keys silently forever.
        if (import.meta.env.DEV) console.warn(`[i18n] Missing translation key: "${key}"`);
        return key;
      }
      return interpolate(value, vars);
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
