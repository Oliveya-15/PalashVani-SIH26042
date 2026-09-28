// MODIFIED FILE -- your existing frontend/src/router.tsx with the three
// additions marked "NEW" below: three lazy imports and three route
// entries (Login, Register, and a ProtectedRoute-wrapped Profile).
// Every existing route and the withSuspense/SuspenseFallback helpers are
// unchanged.
import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { LoadingState } from "@/components/LoadingState";
import { ProtectedRoute } from "@/components/ProtectedRoute"; // NEW
import { useI18n } from "@/i18n/I18nProvider";

// Code-split every route: the classroom/school hardware this is built for
// (see docs/limitations.md) may be low-end, so we ship only the JS a given
// page actually needs instead of one large bundle.
const Home = lazy(() => import("@/pages/Home"));
const Translate = lazy(() => import("@/pages/Translate"));
const Search = lazy(() => import("@/pages/Search"));
const Curriculum = lazy(() => import("@/pages/Curriculum"));
const ChapterDetail = lazy(() => import("@/pages/ChapterDetail"));
const Flashcards = lazy(() => import("@/pages/Flashcards"));
const Dataset = lazy(() => import("@/pages/Dataset"));
const About = lazy(() => import("@/pages/About"));
const Feedback = lazy(() => import("@/pages/Feedback"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Login"));       // NEW
const Register = lazy(() => import("@/pages/Register")); // NEW
const Profile = lazy(() => import("@/pages/Profile"));   // NEW
const AdminPage = lazy(() => import("@/admin/AdminPage"));

function SuspenseFallback() {
  const { t } = useI18n();
  return <LoadingState label={t("common.loading")} />;
}

function withSuspense(element: JSX.Element) {
  return <Suspense fallback={<SuspenseFallback />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: withSuspense(<Home />) },
      // FIXED: Wrap content routes in ProtectedRoute so they redirect to login
      { 
        path: "/translate", 
        element: withSuspense(<ProtectedRoute><Translate /></ProtectedRoute>) 
      },
      { 
        path: "/search", 
        element: withSuspense(<ProtectedRoute><Search /></ProtectedRoute>) 
      },
      { 
        path: "/curriculum", 
        element: withSuspense(<ProtectedRoute><Curriculum /></ProtectedRoute>) 
      },
      { 
        path: "/curriculum/chapters/:chapterId", 
        element: withSuspense(<ProtectedRoute><ChapterDetail /></ProtectedRoute>) 
      },
      { 
        path: "/flashcards", 
        element: withSuspense(<ProtectedRoute><Flashcards /></ProtectedRoute>) 
      },
      { 
        // Dataset requires a teacher or admin account
        path: "/dataset", 
        element: withSuspense(<ProtectedRoute roles={["teacher", "admin"]}><Dataset /></ProtectedRoute>) 
      },
      { path: "/about", element: withSuspense(<About />) },
      { 
        path: "/feedback", 
        element: withSuspense(<ProtectedRoute><Feedback /></ProtectedRoute>) 
      },
      { path: "/login", element: withSuspense(<Login />) },       // NEW
      { path: "/register", element: withSuspense(<Register />) }, // NEW
      {
        path: "/profile", // NEW
        element: withSuspense(
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>,
        ),
      },
      { path: "*", element: withSuspense(<NotFound />) },
    ],
  },
  {
    path: "/admin",
    element: withSuspense(
      <ProtectedRoute roles={["admin"]}>
        <AdminPage />
      </ProtectedRoute>,
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}