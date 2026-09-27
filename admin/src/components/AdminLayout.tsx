import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users as UsersIcon, BookOpen, GraduationCap,
  MessageSquare, ScrollText, LogOut,
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const ROUTES = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/users", label: "Users", Icon: UsersIcon, end: false },
  { to: "/dataset", label: "Dataset & Rights", Icon: BookOpen, end: false },
  { to: "/curriculum", label: "Curriculum", Icon: GraduationCap, end: false },
  { to: "/feedback", label: "Feedback", Icon: MessageSquare, end: false },
  { to: "/audit-log", label: "Audit Log", Icon: ScrollText, end: false },
];

export function AdminLayout() {
  const { admin, logout } = useAdminAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive ? "bg-secondary text-white" : "text-ink-muted hover:bg-surface-alt hover:text-secondary"
    }`;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-bg px-4 py-6">
        <div className="flex items-center gap-2 px-2 py-1">
          <img src="/full_logo.png" alt="PalashVani Admin" className="h-12 w-auto object-contain" />
        </div>

        <nav className="mt-8 flex-1 space-y-1" aria-label="Admin navigation">
          {ROUTES.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border pt-4">
          {admin && (
            <div className="mb-2 px-2">
              <p className="truncate text-sm font-semibold text-ink">{admin.full_name}</p>
              <p className="truncate text-xs text-ink-muted">{admin.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-muted transition-all duration-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}