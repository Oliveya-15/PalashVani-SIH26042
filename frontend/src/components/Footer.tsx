import { NavLink } from "react-router-dom";
import logofull from "@/assets/logofull.png";
import { useI18n } from "@/i18n/I18nProvider";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-surface-alt">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <img src={logofull} alt={t("common.appName")} className="h-8 w-auto object-contain" />
            <p className="mt-3 text-sm text-ink-muted">{t("footer.rights")}</p>
            <p className="mt-1 text-sm text-ink-muted">{t("footer.madeFor")}</p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <li><NavLink to="/translate" className="text-ink-muted hover:text-secondary">{t("nav.translate")}</NavLink></li>
              <li><NavLink to="/search" className="text-ink-muted hover:text-secondary">{t("nav.search")}</NavLink></li>
              <li><NavLink to="/curriculum" className="text-ink-muted hover:text-secondary">{t("nav.curriculum")}</NavLink></li>
              <li><NavLink to="/dataset" className="text-ink-muted hover:text-secondary">{t("nav.dataset")}</NavLink></li>
              <li><NavLink to="/about" className="text-ink-muted hover:text-secondary">{t("nav.about")}</NavLink></li>
              <li><NavLink to="/feedback" className="text-ink-muted hover:text-secondary">{t("nav.feedback")}</NavLink></li>
            </ul>
          </nav>
        </div>

        <p className="mt-8 border-t border-border pt-6 text-xs text-ink-muted">
          {t("footer.languageSupport")}
        </p>
      </div>
    </footer>
  );
}
