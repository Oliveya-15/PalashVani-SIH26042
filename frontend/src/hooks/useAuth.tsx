// NEW FILE -- authentication state, following the exact same
// Context+Provider pattern already used by I18nProvider (src/i18n/I18nProvider.tsx)
// and ThemeProvider, so it reads consistently with the rest of the codebase.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "@/api/client";
import type { AuthUser, LoginPayload, ProfileUpdatePayload, RegisterPayload } from "@/types";

const TOKEN_STORAGE_KEY = "palashvani.authToken";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true only during the initial "restore session" check
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session on first load: if a token is already saved, ask
  // the backend who it belongs to. If the token is expired/invalid, we
  // quietly sign the user out rather than showing an error -- an expired
  // session should just look like "logged out", not a failure.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.auth
      .me(token)
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null);
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
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

  const persistSession = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    window.localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await api.auth.login(payload);
      persistSession(response.access_token, response.user);
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await api.auth.register(payload);
      persistSession(response.access_token, response.user);
    },
    [persistSession],
  );

  const updateProfile = useCallback(
    async (payload: ProfileUpdatePayload) => {
      if (!token) throw new ApiError("Not logged in.", 401);
      const updated = await api.auth.updateProfile(token, payload);
      setUser(updated);
    },
    [token],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(user), isLoading, login, register, updateProfile, logout }),
    [user, token, isLoading, login, register, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
