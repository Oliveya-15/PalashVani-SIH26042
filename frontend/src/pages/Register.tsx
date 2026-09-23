// NEW FILE
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { ApiError } from "@/api/client";
import type { SelfRegisterableRole } from "@/types";

export default function Register() {
  const { t } = useI18n();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SelfRegisterableRole>("teacher");
  const [schoolName, setSchoolName] = useState("");
  const [district, setDistrict] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
        school_name: schoolName,
        district,
      });
      navigate("/profile", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{t("auth.registerTitle")}</h1>
      <p className="mt-2 text-ink-muted">{t("auth.registerSubtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="register-name" className="mb-1 block text-sm font-semibold text-ink">
            {t("auth.fullNameLabel")}
          </label>
          <input
            id="register-name"
            type="text"
            required
            minLength={2}
            className="field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="register-email" className="mb-1 block text-sm font-semibold text-ink">
            {t("auth.emailLabel")}
          </label>
          <input
            id="register-email"
            type="email"
            required
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="mb-1 block text-sm font-semibold text-ink">
            {t("auth.passwordLabel")}
          </label>
          <input
            id="register-password"
            type="password"
            required
            minLength={8}
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-ink-muted">{t("auth.passwordHint")}</p>
        </div>

        <div>
          <label htmlFor="register-role" className="mb-1 block text-sm font-semibold text-ink">
            {t("auth.roleLabel")}
          </label>
          <select
            id="register-role"
            className="field"
            value={role}
            onChange={(e) => setRole(e.target.value as SelfRegisterableRole)}
          >
            <option value="teacher">{t("auth.roleTeacher")}</option>
            <option value="student">{t("auth.roleStudent")}</option>
          </select>
        </div>

        <div>
          <label htmlFor="register-school" className="mb-1 block text-sm font-semibold text-ink">
            {t("auth.schoolLabel")}
          </label>
          <input
            id="register-school"
            type="text"
            className="field"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="register-district" className="mb-1 block text-sm font-semibold text-ink">
            {t("auth.districtLabel")}
          </label>
          <input
            id="register-district"
            type="text"
            className="field"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          <UserPlus size={16} aria-hidden="true" />
          {submitting ? t("auth.registering") : t("auth.registerBtn")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="font-semibold text-secondary">
          {t("auth.loginLink")}
        </Link>
      </p>
    </div>
  );
}
