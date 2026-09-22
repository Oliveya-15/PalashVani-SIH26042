import { useI18n } from "@/i18n/I18nProvider";

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="inline-flex rounded-full border border-border bg-white p-0.5" role="group" aria-label="Interface language">
      {(["en", "hi"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          aria-pressed={language === lang}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
            language === lang ? "bg-secondary text-white" : "text-ink-muted hover:text-ink"
          }`}
        >
          {lang === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}
