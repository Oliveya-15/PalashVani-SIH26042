import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

const TECH_STACK = [
  "React + TypeScript + Vite",
  "Tailwind CSS",
  "Python 3 + FastAPI",
  "SQLite (PostgreSQL-ready)",
  "sentence-transformers (MiniLM, optional semantic layer)",
  "Tesseract.js (in-browser OCR)",
  "Web Speech API (voice input & text-to-speech)",
];

const SOURCES = [
  "Omniglot.com — Numbers in Mundari",
  "mundariversity.com — Mundari-Hindi-English vocabulary & conversation lessons",
];

export default function About() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{t("about.title")}</h1>
      <p className="mt-2 text-ink-muted">{t("about.subtitle")}</p>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-ink">{t("about.problemStatementTitle")}</h2>
        <p className="mt-2 text-ink-muted">{t("about.problemStatementBody")}</p>
      </section>

      <section className="mt-8 rounded-card border border-secondary/20 bg-secondary/5 p-5">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-secondary">
          <ShieldCheck size={22} aria-hidden="true" />
          {t("about.confidenceFlagTitle")}
        </h2>
        <p className="mt-2 text-ink-muted">{t("about.confidenceFlagBody")}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-ink">{t("about.limitationsTitle")}</h2>
        <p className="mt-2 text-ink-muted">{t("about.limitationsBody")}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-ink">{t("about.futureScopeTitle")}</h2>
        <p className="mt-2 text-ink-muted">{t("about.futureScopeBody")}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-ink">{t("about.techStackTitle")}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {TECH_STACK.map((tech) => (
            <li key={tech} className="rounded-full border border-border px-3 py-1.5 text-sm text-ink">
              {tech}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-ink">{t("about.sourcesTitle")}</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-ink-muted">
          {SOURCES.map((src) => (
            <li key={src}>{src}</li>
          ))}
        </ul>
        <Link to="/dataset" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary">
          {t("about.viewDatasetPage")} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
