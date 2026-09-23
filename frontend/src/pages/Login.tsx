// NEW FILE
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { ApiError } from "@/api/client";

export default function Login() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname: string } } };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(location.state?.from?.pathname || "/profile", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{t("auth.loginTitle")}</h1>
      <p className="mt-2 text-ink-muted">{t("auth.loginSubtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-semibold text-ink">
            {t("auth.emailLabel")}
          </label>
          <input
            id="login-email"
            type="email"
            required
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-semibold text-ink">
            {t("auth.passwordLabel")}
          </label>
          <input
            id="login-password"
            type="password"
            required
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          <LogIn size={16} aria-hidden="true" />
          {submitting ? t("auth.loggingIn") : t("auth.loginBtn")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {t("auth.noAccountYet")}{" "}
        <Link to="/register" className="font-semibold text-secondary">
          {t("auth.registerLink")}
        </Link>
      </p>
    </div>
  );
}
