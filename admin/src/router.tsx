import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import UsersPage from "@/pages/Users";
import DatasetPage from "@/pages/Dataset";
import CurriculumPage from "@/pages/Curriculum";
import FeedbackPage from "@/pages/Feedback";
import AuditLogPage from "@/pages/AuditLog";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/users", element: <UsersPage /> },
      { path: "/dataset", element: <DatasetPage /> },
      { path: "/curriculum", element: <CurriculumPage /> },
      { path: "/feedback", element: <FeedbackPage /> },
      { path: "/audit-log", element: <AuditLogPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
