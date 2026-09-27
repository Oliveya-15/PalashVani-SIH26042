import type {
  AdminDatasetEntry,
  AdminDatasetEntryCreatePayload,
  AdminDatasetEntryListResponse,
  AdminDatasetEntryUpdatePayload,
  AdminFeedbackListResponse,
  AdminUser,
  AdminUserListResponse,
  AdminUserUpdatePayload,
  AuditLogListResponse,
  AuthResponse,
  DashboardStats,
} from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    });
  } catch {
    throw new ApiError("Could not reach the PalashVani server.", 0);
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      /* not JSON */
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  me: (token: string) => request<AdminUser>("/auth/me", { headers: authHeaders(token) }),

  users: {
    list: (token: string, params: { role?: string; search?: string; page?: number; pageSize?: number }) => {
      const qs = new URLSearchParams();
      if (params.role) qs.set("role", params.role);
      if (params.search) qs.set("search", params.search);
      qs.set("page", String(params.page ?? 1));
      qs.set("page_size", String(params.pageSize ?? 20));
      return request<AdminUserListResponse>(`/admin/users?${qs}`, { headers: authHeaders(token) });
    },
    update: (token: string, userId: number, payload: AdminUserUpdatePayload) =>
      request(`/admin/users/${userId}`, {
        method: "PATCH", headers: authHeaders(token), body: JSON.stringify(payload),
      }),
  },

  dataset: {
    list: (
      token: string,
      params: { category?: string; rightsStatus?: string; search?: string; page?: number; pageSize?: number },
    ) => {
      const qs = new URLSearchParams();
      if (params.category) qs.set("category", params.category);
      if (params.rightsStatus) qs.set("rights_status", params.rightsStatus);
      if (params.search) qs.set("search", params.search);
      qs.set("page", String(params.page ?? 1));
      qs.set("page_size", String(params.pageSize ?? 25));
      return request<AdminDatasetEntryListResponse>(`/admin/dataset?${qs}`, { headers: authHeaders(token) });
    },
    create: (token: string, payload: AdminDatasetEntryCreatePayload) =>
      request<AdminDatasetEntry>("/admin/dataset", {
        method: "POST", headers: authHeaders(token), body: JSON.stringify(payload),
      }),
    update: (token: string, entryId: number, payload: AdminDatasetEntryUpdatePayload) =>
      request<AdminDatasetEntry>(`/admin/dataset/${entryId}`, {
        method: "PATCH", headers: authHeaders(token), body: JSON.stringify(payload),
      }),
    remove: (token: string, entryId: number) =>
      request<void>(`/admin/dataset/${entryId}`, { method: "DELETE", headers: authHeaders(token) }),
  },

  curriculum: {
    createChapter: (token: string, payload: { subject_id: number; title_en: string; title_hi: string; order_index: number }) =>
      request("/admin/curriculum/chapters", {
        method: "POST", headers: authHeaders(token), body: JSON.stringify(payload),
      }),
    updateChapter: (token: string, chapterId: number, payload: { title_en?: string; title_hi?: string; order_index?: number }) =>
      request(`/admin/curriculum/chapters/${chapterId}`, {
        method: "PATCH", headers: authHeaders(token), body: JSON.stringify(payload),
      }),
    deleteChapter: (token: string, chapterId: number) =>
      request<void>(`/admin/curriculum/chapters/${chapterId}`, { method: "DELETE", headers: authHeaders(token) }),
    linkEntry: (token: string, entryId: number, chapterId: number | null) =>
      request<void>("/admin/curriculum/link-entry", {
        method: "POST", headers: authHeaders(token),
        body: JSON.stringify({ entry_id: entryId, chapter_id: chapterId }),
      }),
    // Reuses the main app's own read-only grades endpoint -- there's no
    // reason to duplicate that query just because this is a separate app.
    grades: (token: string) => request("/curriculum/grades", { headers: authHeaders(token) }),
  },

  dashboard: {
    stats: (token: string) => request<DashboardStats>("/admin/dashboard/stats", { headers: authHeaders(token) }),
    feedback: (token: string, page = 1, pageSize = 25) =>
      request<AdminFeedbackListResponse>(
        `/admin/dashboard/feedback?page=${page}&page_size=${pageSize}`, { headers: authHeaders(token) },
      ),
    auditLog: (token: string, page = 1, pageSize = 25) =>
      request<AuditLogListResponse>(
        `/admin/dashboard/audit-log?page=${page}&page_size=${pageSize}`, { headers: authHeaders(token) },
      ),
  },
};
