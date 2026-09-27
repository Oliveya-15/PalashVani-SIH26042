import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ApiError } from "@/api/client";
import logofull from "@/assets/logofull.png";

export default function Login() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-xl">
        <img src={logofull} alt="PalashVani" className="h-8 w-auto" />
        <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-secondary">
          <ShieldCheck size={16} aria-hidden="true" />
          Administrator sign-in
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          For Dept. of Higher &amp; Technical Education / PALASH programme oversight only.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ink">Email</label>
            <input
              id="email" type="email" required autoComplete="email" className="field"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-ink">Password</label>
            <input
              id="password" type="password" required autoComplete="current-password" className="field"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            <LogIn size={16} aria-hidden="true" />
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-xs text-ink-muted">
          Don't have an admin account? Ask whoever controls the database to run
          <code className="mx-1 rounded bg-surface-alt px-1.5 py-0.5">scripts/create_admin.py</code>
          -- admin accounts aren't self-registered here.
        </p>
      </div>
    </div>
  );
}
