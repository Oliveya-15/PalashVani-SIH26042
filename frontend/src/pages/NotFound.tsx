import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-display text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">{t("notFound.title")}</h1>
      <p className="mt-2 text-ink-muted">{t("notFound.body")}</p>
      <Link to="/" className="btn-primary mt-6">
        <Home size={16} aria-hidden="true" />
        {t("notFound.cta")}
      </Link>
    </div>
  );
}
