// NEW FILE -- redirects to /login if the user isn't authenticated, used
// to guard the Profile page (see router.tsx's small addition).
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/LoadingState";
import { useI18n } from "@/i18n/I18nProvider";

import type { UserRole } from "@/types";

export function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: UserRole[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (isLoading) return <LoadingState label={t("common.loading")} />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user?.role ?? "student")) {
    return <Navigate to="/" replace />;
  }
  return children;
}
