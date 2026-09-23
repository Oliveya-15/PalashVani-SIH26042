import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home as HomeIcon,
  Languages,
  BookOpen,
  GraduationCap,
  Layers,
  HardDriveDownload,
  Info,
  MessageSquare,
  Menu,
  X,
  LogIn,   
  LogOut,  
  UserCircle, 
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth"; 
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const ROUTES = [
  { to: "/", key: "nav.home", Icon: HomeIcon, end: true },
  { to: "/translate", key: "nav.translate", Icon: Languages, end: false },
  { to: "/search", key: "nav.search", Icon: BookOpen, end: false },
  { to: "/curriculum", key: "nav.curriculum", Icon: GraduationCap, end: false },
  { to: "/flashcards", key: "nav.flashcards", Icon: Layers, end: false },
  { to: "/dataset", key: "nav.dataset", Icon: HardDriveDownload, end: false },
  { to: "/about", key: "nav.about", Icon: Info, end: false },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { user, isAuthenticated, logout } = useAuth(); 

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive ? "bg-secondary text-white" : "text-ink-muted hover:bg-surface-alt hover:text-secondary"
    }`;

  return (
    <div className="flex h-full flex-col">
      {/* Original Logo format */}
      <NavLink to="/" className="flex items-center gap-2 px-2 py-1" aria-label="PalashVani home" onClick={onNavigate}>
        <img src="/full_logo.png" alt="PalashVani" className="h-12 w-auto object-contain" />
      </NavLink>

      <nav className="mt-8 flex-1 space-y-1" aria-label="Primary">
        {ROUTES.map(({ to, key, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} onClick={onNavigate}>
            <Icon size={18} aria-hidden="true" />
            {t(key)}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section: Auth block, Feedback, Language Switcher */}
      <div className="space-y-4 border-t border-border pt-4">
        
        {/* Auth Block */}
        {isAuthenticated && user ? (
          <div className="flex flex-col gap-2">
            <NavLink
              to="/profile"
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-xl bg-surface-alt px-3 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-alt hover:text-secondary"
            >
              <UserCircle size={20} aria-hidden="true" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-ink">Profile</span>
                <span className="text-xs text-ink-muted truncate">{user.full_name}</span>
              </div>
            </NavLink>
            
            {/* UPDATED: Logout button with subtle red hover effect */}
            <button
              type="button"
              onClick={() => {
                logout();
                onNavigate?.();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-muted transition-all duration-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} aria-hidden="true" />
              {t("auth.logoutBtn")}
            </button>
          </div>
        ) : (
          /* UPDATED: Animated Semi-circle Login Button with zoom and lighter green hover */
          <NavLink
            to="/login"
            onClick={onNavigate}
            className="group flex w-full items-center justify-center gap-0 rounded-full border-2 border-secondary bg-transparent px-[2px] py-2.5 text-sm font-semibold text-secondary transition-all duration-300 hover:scale-105 hover:bg-secondary/90 hover:text-white hover:shadow-lg hover:shadow-secondary/30"
          >
            <LogIn size={18} className="transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
            {t("nav.login")}
          </NavLink>
        )}

        <NavLink
          to="/feedback"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-alt hover:text-secondary"
        >
          <MessageSquare size={18} aria-hidden="true" />
          {t("nav.feedback")}
        </NavLink>

        <div className="px-2">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-bg px-4 lg:hidden">
        <NavLink to="/" className="flex items-center gap-2" aria-label="PalashVani home">
          <img src="/full_logo.png" alt="PalashVani" className="h-7 w-auto object-contain" />
        </NavLink>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-secondary"
          aria-expanded={open}
          aria-controls="mobile-sidebar"
          aria-label={open ? t("common.close") : t("nav.openMenu")}
          onClick={() => setOpen(true)}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </header>

      {/* Desktop fixed sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-bg px-4 py-6 lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile off-canvas drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("common.close")}
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <div id="mobile-sidebar" className="absolute inset-y-0 left-0 w-72 max-w-[80vw] overflow-y-auto bg-bg px-4 py-6 shadow-xl">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}