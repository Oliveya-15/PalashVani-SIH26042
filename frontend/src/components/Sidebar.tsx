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
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
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

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive ? "bg-secondary text-white" : "text-ink-muted hover:bg-surface-alt hover:text-secondary"
    }`;

  return (
    <div className="flex h-full flex-col">
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

      <div className="space-y-3 border-t border-border pt-4">
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