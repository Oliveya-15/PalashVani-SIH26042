import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LoadingState } from "@/components/LoadingState";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  if (isLoading) return <LoadingState label="Checking session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
