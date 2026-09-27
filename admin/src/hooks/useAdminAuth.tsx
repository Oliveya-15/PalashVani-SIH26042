// Deliberately its own token storage key (not shared with the main
// frontend app, even though they'll usually run on different origins
// anyway) -- an admin session and a teacher/student session should never
// be able to bleed into each other.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "@/api/client";
import type { AdminUser } from "@/types";

const TOKEN_KEY = "palashvani-admin.authToken";

interface AdminAuthContextValue {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY),
  );
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.me(token)
      .then((profile) => {
        if (cancelled) return;
        // A valid PalashVani login that isn't an admin account must never
        // reach the dashboard -- checked here in addition to every
        // individual API call already being server-side role-gated.
        if (profile.role !== "admin") {
          setToken(null);
          window.localStorage.removeItem(TOKEN_KEY);
          setAdmin(null);
        } else {
          setAdmin(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null);
          window.localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.user.role !== "admin") {
      throw new ApiError(
        "This account doesn't have admin access. Log in with an administrator account.",
        403,
      );
    }
    setToken(response.access_token);
    setAdmin(response.user);
    window.localStorage.setItem(TOKEN_KEY, response.access_token);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
    window.localStorage.removeItem(TOKEN_KEY);
  }, []);

  const value = useMemo(
    () => ({ admin, token, isLoading, isAuthenticated: Boolean(admin), login, logout }),
    [admin, token, isLoading, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
