import { Link } from "react-router-dom";
import { ArrowRight, Camera, Layers, Mic, WifiOff } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

const STATS = [
  { value: "1,041+", key: "home.statsSchools" },
  { value: "6", key: "home.statsDistricts" },
  { value: "5", key: "home.statsLanguages" },
  { value: "1–5", key: "home.statsGrades" },
];

const FEATURES = [
  { Icon: Layers, titleKey: "home.feature1Title", bodyKey: "home.feature1Body" },
  { Icon: Camera, titleKey: "home.feature2Title", bodyKey: "home.feature2Body" },
  { Icon: Mic, titleKey: "home.feature3Title", bodyKey: "home.feature3Body" },
  { Icon: WifiOff, titleKey: "home.feature4Title", bodyKey: "home.feature4Body" },
];

const STEPS = ["step1", "step2", "step3", "step4", "step5", "step6"] as const;

function LiveDemo() {
  const { t } = useI18n();

  // A static, always-available demo -- deliberately NOT a live API call, so
  // the homepage hero renders instantly and correctly even before the
  // backend is reachable. The pair shown is a genuine row from the
  // verified seed corpus (see data/raw/hindi_mundari_seed.csv), not a
  // fabricated example.
  return (
    <div className="w-full max-w-sm rounded-card bg-white/10 p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/70">{t("home.demoLabel")}</p>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-white/60">{t("translate.sourceLabel")}</p>
          <p className="font-display text-xl font-semibold text-white">{t("home.demoHindi")}</p>
        </div>
        <div className="border-t border-white/15 pt-3">
          <p className="text-xs text-white/60">{t("translate.targetLabel")}</p>
          <p lang="unr" className="font-display text-xl font-semibold text-white">
            आम चिलेका मेना मा?
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/20 px-3 py-1 text-xs font-semibold text-white">
          {t("translate.confidenceHigh")}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();

  return (
    <div>
      {/* Hero */}
      <section className="bg-secondary text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:py-24">
          <div className="max-w-xl">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/90">
              {t("home.heroEyebrow")}
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/85 sm:text-lg">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/translate" className="btn-primary">
                {t("home.ctaTranslate")} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/curriculum" className="btn-secondary !border-white/30 !bg-transparent !text-white hover:!bg-white/10">
                {t("home.ctaCurriculum")}
              </Link>
            </div>
          </div>

          <div className="flex w-full justify-center lg:justify-end">
            <LiveDemo />
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-white/10">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6">
            {STATS.map((s) => (
              <div key={s.key}>
                <dt className="sr-only">{t(s.key)}</dt>
                <dd className="font-display text-3xl font-bold">{s.value}</dd>
                <dd className="mt-1 text-sm text-white/70">{t(s.key)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">{t("home.problemTitle")}</h2>
          <p className="mt-3 leading-relaxed text-ink-muted">{t("home.problemBody")}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">{t("home.solutionTitle")}</h2>
          <p className="mt-3 leading-relaxed text-ink-muted">{t("home.solutionBody")}</p>
        </div>
      </section>

      {/* How AI helps */}
      <section className="bg-surface-alt">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-ink">{t("home.howAiHelpsTitle")}</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-muted">{t("home.howAiHelpsBody")}</p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-ink">{t("home.featuresTitle")}</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {FEATURES.map(({ Icon, titleKey, bodyKey }) => (
            <div key={titleKey} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={22} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">{t(titleKey)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t(bodyKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works (genuinely sequential -> numbered) */}
      <section className="bg-secondary/5">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-ink">{t("home.howItWorksTitle")}</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((stepKey, idx) => (
              <li key={stepKey} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm font-bold text-white">
                  {idx + 1}
                </span>
                <span className="pt-1 text-sm font-medium text-ink">{t(`home.${stepKey}`)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-2xl font-bold text-ink">{t("home.ctaSectionTitle")}</h2>
        <p className="mt-2 text-ink-muted">{t("home.ctaSectionBody")}</p>
        <Link to="/translate" className="btn-primary mt-6 inline-flex">
          {t("home.ctaTranslate")} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
