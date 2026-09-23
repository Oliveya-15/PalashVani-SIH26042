// NEW FILE
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Save, ShieldCheck, GraduationCap, Landmark } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { ApiError } from "@/api/client";
import { formatDate } from "@/utils/format";

const ROLE_ICON = { teacher: GraduationCap, student: GraduationCap, admin: Landmark } as const;
const ROLE_LABEL_KEY = { teacher: "auth.roleTeacher", student: "auth.roleStudent", admin: "auth.roleAdmin" } as const;

export default function Profile() {
  const { t, language } = useI18n();
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [schoolName, setSchoolName] = useState(user?.school_name ?? "");
  const [district, setDistrict] = useState(user?.district ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null; // ProtectedRoute guarantees this won't render while logged out

  const RoleIcon = ROLE_ICON[user.role];

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await updateProfile({ full_name: fullName, school_name: schoolName, district });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{t("auth.profileTitle")}</h1>

      <div className="card mt-6 flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <RoleIcon size={26} aria-hidden="true" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-ink">{user.full_name}</p>
          <p className="text-sm text-ink-muted">{user.email}</p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary">
            <ShieldCheck size={12} aria-hidden="true" />
            {t(ROLE_LABEL_KEY[user.role])}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="card mt-6 space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">{t("auth.editProfileTitle")}</h2>

        <div>
          <label htmlFor="profile-name" className="mb-1 block text-sm font-semibold text-ink">
            {t("auth.fullNameLabel")}
          </label>
          <input
            id="profile-name"
            type="text"
            className="field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="profile-school" className="mb-1 block text-sm font-semibold text-ink">
            {t("auth.schoolLabel")}
          </label>
          <input
            id="profile-school"
            type="text"
            className="field"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="profile-district" className="mb-1 block text-sm font-semibold text-ink">
            {t("auth.districtLabel")}
          </label>
          <input
            id="profile-district"
            type="text"
            className="field"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>

        <p className="text-xs text-ink-muted">
          {t("auth.memberSince")}: {formatDate(user.created_at, language)}
        </p>

        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && <p className="text-sm text-success">{t("auth.profileSaved")}</p>}

        <button type="submit" disabled={submitting} className="btn-primary">
          <Save size={16} aria-hidden="true" />
          {submitting ? t("common.loading") : t("common.save")}
        </button>
      </form>

      <button type="button" onClick={handleLogout} className="btn-secondary mt-6">
        <LogOut size={16} aria-hidden="true" />
        {t("auth.logoutBtn")}
      </button>
    </div>
  );
}
