import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpenCheck,
  Check,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError } from "@/api/client";
import type { AdminActivity, AdminFeedback, AdminOverview, AdminSubmission, AdminUser, UserRole } from "@/types";

type Tab = "overview" | "users" | "content" | "activity" | "feedback";

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users & schools", icon: Users },
  { id: "content", label: "Content review", icon: ClipboardCheck },
  { id: "activity", label: "Activity log", icon: Activity },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function StatCard({ label, value, hint, accent }: { label: string; value: number; hint: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value.toLocaleString("en-IN")}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {active ? "Active" : "Suspended"}
    </span>
  );
}

function Empty({ children }: { children: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{children}</div>;
}

export default function AdminPage() {
  const { token, user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadOverview = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [nextOverview, nextUsers, nextSubmissions, nextActivity, nextFeedback] = await Promise.all([
        api.admin.overview(token),
        api.admin.users(token, { q: search, role: roleFilter, active: activeFilter }),
        api.admin.submissions(token),
        api.admin.activity(token),
        api.admin.feedback(token),
      ]);
      setOverview(nextOverview);
      setUsers(nextUsers.users);
      setSubmissions(nextSubmissions);
      setActivity(nextActivity);
      setFeedback(nextFeedback);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the administration console.");
    } finally {
      setLoading(false);
    }
  }, [token, search, roleFilter, activeFilter]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const pendingCount = overview?.pending_submissions ?? submissions.length;
  const currentTab = useMemo(() => tabs.find((item) => item.id === tab) ?? tabs[0], [tab]);

  async function toggleUser(account: AdminUser) {
    if (!token) return;
    setBusyId(account.id);
    try {
      const updated = await api.admin.setUserStatus(token, account.id, !account.is_active);
      setUsers((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this account.");
    } finally {
      setBusyId(null);
    }
  }

  async function changeRole(account: AdminUser, nextRole: UserRole) {
    if (!token || account.role === nextRole) return;
    setBusyId(account.id);
    try {
      const updated = await api.admin.setUserRole(token, account.id, nextRole);
      setUsers((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change this account role.");
    } finally {
      setBusyId(null);
    }
  }

  async function review(submission: AdminSubmission, decision: "approve" | "reject") {
    if (!token) return;
    setBusyId(submission.id);
    try {
      await api.admin.reviewSubmission(token, submission.id, decision, decision === "approve" ? "Approved by administrator." : "Please provide a licensed, verifiable source.");
      setSubmissions((items) => items.filter((item) => item.id !== submission.id));
      setOverview((current) => current ? { ...current, pending_submissions: Math.max(0, current.pending_submissions - 1), verified_entries: decision === "approve" ? current.verified_entries + 1 : current.verified_entries } : current);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not review this submission.");
    } finally {
      setBusyId(null);
    }
  }

  function selectTab(next: Tab) {
    setTab(next);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        {mobileOpen && <button aria-label="Close admin navigation" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-950 px-5 py-6 text-white transition-transform lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">PalashVani</p>
              <h1 className="mt-1 text-xl font-bold">Administration</h1>
            </div>
            <button className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
          </div>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 font-bold text-slate-950">{user?.full_name.slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.full_name}</p>
                <p className="text-xs text-slate-400">Government administrator</p>
              </div>
            </div>
          </div>
          <nav className="mt-8 flex-1 space-y-1" aria-label="Administration">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => selectTab(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${tab === id ? "bg-amber-300 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                <Icon size={18} />{label}
                {id === "content" && pendingCount > 0 && <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${tab === id ? "bg-slate-950 text-amber-300" : "bg-amber-300 text-slate-950"}`}>{pendingCount}</span>}
              </button>
            ))}
          </nav>
          <div className="border-t border-white/10 pt-4">
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"><LogOut size={18} />Sign out</button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open admin navigation"><Menu size={22} /></button>
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">Control centre</p><h2 className="text-xl font-bold text-slate-950">{currentTab.label}</h2></div>
            </div>
            <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex"><ShieldCheck size={16} className="text-emerald-600" />Protected administrator session</div>
          </header>

          <div className="mx-auto max-w-7xl p-5 sm:p-8">
            {error && <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}
            {loading && !overview ? <div className="rounded-2xl bg-white p-12 text-center text-sm text-slate-500">Loading governance data…</div> : (
              <>
                {tab === "overview" && overview && <OverviewPanel overview={overview} onOpen={selectTab} />}
                {tab === "users" && <UsersPanel users={users} search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter} activeFilter={activeFilter} setActiveFilter={setActiveFilter} busyId={busyId} onToggle={toggleUser} onRoleChange={changeRole} />}
                {tab === "content" && <ContentPanel submissions={submissions} busyId={busyId} onReview={review} token={token} onCreated={(submission) => { setSubmissions((items) => [submission, ...items]); setOverview((current) => current ? { ...current, pending_submissions: current.pending_submissions + 1 } : current); }} />}
                {tab === "activity" && <ActivityPanel activity={activity} />}
                {tab === "feedback" && <FeedbackPanel feedback={feedback} />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function OverviewPanel({ overview, onOpen }: { overview: AdminOverview; onOpen: (tab: Tab) => void }) {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-sm font-semibold text-amber-300">Jharkhand education authority</p><h3 className="mt-2 max-w-2xl text-2xl font-bold sm:text-3xl">Keep every classroom word accountable.</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Review contributors, protect licensed language data, and see how PalashVani is being used across schools.</p></div>
          <button onClick={() => onOpen("content")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-200"><ClipboardCheck size={17} />Review queue</button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active accounts" value={overview.active_users} hint={`${overview.total_users} total registered`} accent="bg-emerald-500" />
        <StatCard label="Teachers" value={overview.teacher_count} hint={`${overview.student_count} students`} accent="bg-blue-500" />
        <StatCard label="Verified entries" value={overview.verified_entries} hint="Published to learners" accent="bg-violet-500" />
        <StatCard label="Pending review" value={overview.pending_submissions} hint="Needs a copyright decision" accent="bg-amber-500" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-bold">Recent activity</h3><p className="mt-1 text-sm text-slate-500">An auditable trail of administrative and account events.</p></div><Activity size={20} className="text-slate-400" /></div><ActivityList items={overview.recent_activity} /></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="font-bold">Governance checks</h3><div className="mt-5 space-y-4"><CheckRow label="Admin-only content publishing" value="Enforced" /><CheckRow label="Verified dataset visibility" value="Protected" /><CheckRow label="Account suspension control" value="Available" /><CheckRow label="Feedback intake" value={`${overview.feedback_count} received`} /></div></section>
      </div>
    </div>
  );
}

function CheckRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0"><span className="text-slate-600">{label}</span><span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700"><Check size={15} />{value}</span></div>;
}

function UsersPanel({ users, search, setSearch, roleFilter, setRoleFilter, activeFilter, setActiveFilter, busyId, onToggle, onRoleChange }: { users: AdminUser[]; search: string; setSearch: (value: string) => void; roleFilter: string; setRoleFilter: (value: string) => void; activeFilter: string; setActiveFilter: (value: string) => void; busyId: number | null; onToggle: (user: AdminUser) => void; onRoleChange: (user: AdminUser, role: UserRole) => void }) {
  return <section className="space-y-5"><div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"><input className="field !rounded-xl !py-2.5" placeholder="Search name, email, or school" value={search} onChange={(event) => setSearch(event.target.value)} /><select className="field !w-auto !rounded-xl !py-2.5" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">All roles</option><option value="teacher">Teachers</option><option value="student">Students</option><option value="admin">Admins</option></select><select className="field !w-auto !rounded-xl !py-2.5" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}><option value="all">All status</option><option value="true">Active</option><option value="false">Suspended</option></select></div><div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">{users.length === 0 ? <Empty>No accounts match the current filters.</Empty> : <table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Account</th><th className="px-5 py-4">School / district</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((account) => <tr key={account.id}><td className="px-5 py-4"><p className="font-semibold text-slate-900">{account.full_name}</p><p className="text-xs text-slate-500">{account.email}</p></td><td className="px-5 py-4 text-slate-600">{account.school_name || "—"}<br /><span className="text-xs text-slate-400">{account.district || "District not set"}</span></td><td className="px-5 py-4"><select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700" value={account.role} onChange={(event) => onRoleChange(account, event.target.value as UserRole)} disabled={busyId === account.id}><option value="teacher">Teacher</option><option value="student">Student</option><option value="admin">Admin</option></select></td><td className="px-5 py-4"><StatusPill active={account.is_active} /></td><td className="px-5 py-4"><button className="text-xs font-bold text-slate-700 underline underline-offset-2 hover:text-amber-700 disabled:opacity-40" disabled={busyId === account.id} onClick={() => onToggle(account)}>{account.is_active ? "Suspend" : "Reactivate"}</button></td></tr>)}</tbody></table>}</div></section>;
}

function ContentPanel({ submissions, busyId, onReview, token, onCreated }: { submissions: AdminSubmission[]; busyId: number | null; onReview: (submission: AdminSubmission, decision: "approve" | "reject") => void; token: string | null; onCreated: (submission: AdminSubmission) => void }) {
  const [formOpen, setFormOpen] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [citation, setCitation] = useState("");
  const [license, setLicense] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function addProposal() {
    if (!token || !sourceText.trim() || !targetText.trim()) {
      setFormError("Add both the source phrase and its verified translation.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const submission = await api.content.submit(token, {
        content_type: "dataset",
        source_language_code: "hi",
        target_language_code: "mundari",
        source_text: sourceText,
        target_text: targetText,
        source_citation: citation,
        license,
      });
      onCreated(submission);
      setSourceText("");
      setTargetText("");
      setCitation("");
      setLicense("");
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not add the proposal.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="space-y-5"><div className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center"><div className="flex gap-3"><FileText className="mt-0.5 shrink-0 text-amber-700" size={20} /><div><h3 className="font-bold text-amber-950">Nothing publishes automatically</h3><p className="mt-1 text-sm leading-6 text-amber-900/80">Check the language pair, source citation, and licence before approving. Approved entries become visible to the public dictionary and translation pipeline.</p></div></div><button onClick={() => setFormOpen((open) => !open)} className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">{formOpen ? "Close form" : "Add proposal"}</button></div>{formOpen && <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold">Submit a verified Hindi → Mundari entry</h3><p className="mt-1 text-sm text-slate-500">It will still enter the review queue so the decision is recorded.</p></div><BookOpenCheck size={20} className="text-slate-400" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-xs font-bold uppercase text-slate-500">Hindi source</label><textarea className="field min-h-24" value={sourceText} onChange={(event) => setSourceText(event.target.value)} /></div><div><label className="mb-1 block text-xs font-bold uppercase text-slate-500">Mundari translation</label><textarea className="field min-h-24" value={targetText} onChange={(event) => setTargetText(event.target.value)} /></div><div><label className="mb-1 block text-xs font-bold uppercase text-slate-500">Source citation</label><input className="field" value={citation} onChange={(event) => setCitation(event.target.value)} placeholder="Book, survey, contributor, or dataset URL" /></div><div><label className="mb-1 block text-xs font-bold uppercase text-slate-500">Licence</label><input className="field" value={license} onChange={(event) => setLicense(event.target.value)} placeholder="CC BY 4.0, government-owned, etc." /></div></div>{formError && <p className="mt-3 text-sm text-rose-700">{formError}</p>}<button onClick={() => void addProposal()} disabled={saving} className="btn-primary mt-4">{saving ? "Submitting…" : "Submit for review"}</button></div>}{submissions.length === 0 ? <Empty>The review queue is clear.</Empty> : <div className="space-y-4">{submissions.map((submission) => <article key={submission.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">{submission.content_type}</span><span className="text-xs text-slate-500">{submission.source_language_code} → {submission.target_language_code} · {formatDate(submission.created_at)}</span></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-slate-400">Source</p><p className="mt-1 font-semibold">{submission.source_text}</p></div><div><p className="text-xs font-semibold uppercase text-slate-400">Proposed translation</p><p className="mt-1 font-semibold text-emerald-800">{submission.target_text}</p></div></div><p className="mt-4 text-sm text-slate-500"><strong>Category:</strong> {submission.category || "General"} · <strong>Licence:</strong> {submission.license || "Not supplied"} · <strong>Source:</strong> {submission.source_citation || "Not supplied"}</p></div><div className="flex shrink-0 gap-2 sm:flex-col"><button onClick={() => onReview(submission, "approve")} disabled={busyId === submission.id} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Check size={16} />Approve</button><button onClick={() => onReview(submission, "reject")} disabled={busyId === submission.id} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Reject</button></div></div></article>)}</div>}</section>;
}

function ActivityPanel({ activity }: { activity: AdminActivity[] }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><Activity className="text-slate-400" size={20} /><div><h3 className="font-bold">Audit activity</h3><p className="mt-1 text-sm text-slate-500">Recent account, permission, and content decisions.</p></div></div><ActivityList items={activity} /></section>;
}

function ActivityList({ items }: { items: AdminActivity[] }) {
  if (!items.length) return <Empty>No activity has been recorded yet.</Empty>;
  return <div className="mt-5 divide-y divide-slate-100">{items.map((event) => <div key={event.id} className="flex gap-3 py-4 first:pt-0"><span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Activity size={15} /></span><div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-1 sm:flex-row"><p className="font-semibold text-slate-800">{event.action.split("_").join(" ")}</p><time className="text-xs text-slate-400">{formatDate(event.created_at)}</time></div><p className="mt-1 text-sm text-slate-500">{event.user_name || "System"}{event.detail ? ` · ${event.detail}` : ""}</p></div></div>)}</div>;
}

function FeedbackPanel({ feedback }: { feedback: AdminFeedback[] }) {
  return <section className="space-y-4">{feedback.length === 0 ? <Empty>No feedback has been submitted yet.</Empty> : feedback.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">{item.message}</p><p className="mt-2 text-xs text-slate-500">{item.page} · {formatDate(item.created_at)}</p></div>{item.rating && <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">{item.rating}/5</span>}</div></article>)}</section>;
}