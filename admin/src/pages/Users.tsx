import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Search, Shield } from "lucide-react";
import { api } from "@/api/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Badge } from "@/components/Badge";
import { Pagination } from "@/components/Pagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Modal } from "@/components/Modal";
import type { AdminUserRow, UserRole } from "@/types";
import { formatDate } from "@/utils/format";

const ROLE_TONE: Record<UserRole, "secondary" | "primary" | "danger"> = {
  teacher: "secondary", student: "primary", admin: "danger",
};

export default function UsersPage() {
  const { token, admin: currentAdmin } = useAdminAuth();
  const queryClient = useQueryClient();

  const [role, setRole] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<AdminUserRow | null>(null);
  const [editTarget, setEditTarget] = useState<AdminUserRow | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users", role, search, page],
    queryFn: () => api.users.list(token as string, { role: role === "all" ? undefined : role, search: search || undefined, page }),
    enabled: Boolean(token),
  });

  const toggleActive = useMutation({
    mutationFn: (user: AdminUserRow) => api.users.update(token as string, user.id, { is_active: !user.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmTarget(null);
    },
  });

  const updateDetails = useMutation({
    mutationFn: (payload: { userId: number; role?: UserRole; school_name?: string; district?: string }) =>
      api.users.update(token as string, payload.userId, {
        role: payload.role, school_name: payload.school_name, district: payload.district,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditTarget(null);
    },
  });

  const totalPages = usersQuery.data ? Math.max(1, Math.ceil(usersQuery.data.total / usersQuery.data.page_size)) : 1;

  return (
    <div className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink">Users</h1>
      <p className="mt-1 text-sm text-ink-muted">Every teacher, student, and admin account. Activate, deactivate, or edit school/district.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} aria-hidden="true" />
          <input
            className="field pl-9" placeholder="Search name or email..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="field w-40" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="all">All roles</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="mt-6">
        {usersQuery.isLoading && <LoadingState label="Loading users..." />}
        {usersQuery.isError && <ErrorState message="Couldn't load users." onRetry={() => usersQuery.refetch()} />}

        {usersQuery.data && (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">School / District</th>
                  <th className="px-4 py-3 font-semibold">Activity</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{user.full_name}</p>
                      <p className="text-xs text-ink-muted">{user.email}</p>
                    </td>
                    <td className="px-4 py-3"><Badge tone={ROLE_TONE[user.role]}>{user.role}</Badge></td>
                    <td className="px-4 py-3 text-ink-muted">
                      {user.school_name || "—"}{user.district ? `, ${user.district}` : ""}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {user.translation_count} translations · {user.feedback_count} feedback
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <span className="flex items-center gap-1 text-success"><CheckCircle2 size={14} aria-hidden="true" /> Active</span>
                      ) : (
                        <span className="flex items-center gap-1 text-danger"><XCircle size={14} aria-hidden="true" /> Deactivated</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setEditTarget(user)} className="text-xs font-semibold text-secondary hover:underline">
                          Edit
                        </button>
                        {user.id !== currentAdmin?.id && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget(user)}
                            className={`text-xs font-semibold hover:underline ${user.is_active ? "text-danger" : "text-success"}`}
                          >
                            {user.is_active ? "Deactivate" : "Reactivate"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {usersQuery.data && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
      </div>

      {confirmTarget && (
        <ConfirmDialog
          title={confirmTarget.is_active ? "Deactivate this account?" : "Reactivate this account?"}
          body={
            confirmTarget.is_active
              ? `${confirmTarget.full_name} will no longer be able to log in. This doesn't delete their data.`
              : `${confirmTarget.full_name} will be able to log in again.`
          }
          confirmLabel={confirmTarget.is_active ? "Deactivate" : "Reactivate"}
          danger={confirmTarget.is_active}
          onConfirm={() => toggleActive.mutate(confirmTarget)}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {editTarget && (
        <Modal title={`Edit ${editTarget.full_name}`} onClose={() => setEditTarget(null)}>
          <EditUserForm
            user={editTarget}
            onSave={(payload) => updateDetails.mutate({ userId: editTarget.id, ...payload })}
            saving={updateDetails.isPending}
          />
        </Modal>
      )}
    </div>
  );
}

function EditUserForm({
  user, onSave, saving,
}: {
  user: AdminUserRow;
  onSave: (payload: { role?: UserRole; school_name?: string; district?: string }) => void;
  saving: boolean;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [schoolName, setSchoolName] = useState(user.school_name);
  const [district, setDistrict] = useState(user.district);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ role, school_name: schoolName, district });
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Shield size={14} aria-hidden="true" /> Role
        </label>
        <select className="field" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
        {role === "admin" && user.role !== "admin" && (
          <p className="mt-1 text-xs text-warning">This grants full admin panel access. Only do this for verified departmental staff.</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">School name</label>
        <input className="field" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">District</label>
        <input className="field" value={district} onChange={(e) => setDistrict(e.target.value)} />
      </div>
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
