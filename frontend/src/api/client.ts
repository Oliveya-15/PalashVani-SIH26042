// MODIFIED FILE -- your existing frontend/src/api/client.ts with two
// changes, both marked "NEW"/"FIXED" below:
//   1. FIXED: the `request()` helper's header merging (see the comment
//      right above it for why this was necessary for auth to work at all).
//   2. NEW: an `auth` section added to the exported `api` object.
// Every existing method (translate, search, curriculum, etc.) is
// byte-for-byte the same as your current file.
import type {
  AuthResponse,
  AuthUser,
  AdminActivity,
  AdminFeedback,
  AdminOverview,
  AdminSubmission,
  AdminUser,
  ChapterDetail,
  DatasetStatsResponse,
  FlashcardDeckResponse,
  GradeSummary,
  HealthResponse,
  Language,
  LoginPayload,
  ProfileUpdatePayload,
  RegisterPayload,
  SearchResponse,
  TranslateResponse,
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
  // FIXED: Automatically retrieve the auth token from localStorage.
  // The AuthProvider saves the token under the key "palashvani.authToken".
  const token = typeof window !== "undefined" ? localStorage.getItem("palashvani.authToken") : null;

  // FIXED: Build the headers dynamically, merging Content-Type, the
  // Authorization header (if a token exists), and any custom headers
  // passed by the specific API call.
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers, // Use the newly constructed headers object
    });
  } catch {
    throw new ApiError(
      "Could not reach the PalashVani server. Is the backend running on port 8000?",
      0,
    );
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      /* response wasn't JSON -- keep the generic message */
    }
    throw new ApiError(detail, response.status);
  }

  return response.json() as Promise<T>;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  languages: () => request<Language[]>("/languages"),

  translate: (text: string, sourceLanguage: string, targetLanguage: string) =>
    request<TranslateResponse>("/translations", {
      method: "POST",
      body: JSON.stringify({ text, source_language: sourceLanguage, target_language: targetLanguage }),
    }),

  search: (params: { q?: string; category?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.category && params.category !== "all") qs.set("category", params.category);
    qs.set("page", String(params.page ?? 1));
    qs.set("page_size", String(params.pageSize ?? 20));
    return request<SearchResponse>(`/translations/search?${qs.toString()}`);
  },

  categories: () => request<string[]>("/translations/categories"),

  datasetStats: () => request<DatasetStatsResponse>("/dataset/stats"),

  curriculumGrades: () => request<GradeSummary[]>("/curriculum/grades"),

  chapterDetail: (chapterId: number) => request<ChapterDetail>(`/curriculum/chapters/${chapterId}`),

  flashcardCategories: () => request<string[]>("/flashcards/categories"),

  flashcardDeck: (category: string) =>
    request<FlashcardDeckResponse>(`/flashcards/deck?category=${encodeURIComponent(category)}`),

  submitFeedback: (payload: { message: string; rating?: number; page: string }) =>
    request<{ id: number }>("/feedback", { method: "POST", body: JSON.stringify(payload) }),

  // ---------------------------------------------------------- NEW: auth --
  auth: {
    register: (payload: RegisterPayload) =>
      request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

    login: (payload: LoginPayload) =>
      request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),

    me: (token: string) => request<AuthUser>("/auth/me", { headers: authHeaders(token) }),

    updateProfile: (token: string, payload: ProfileUpdatePayload) =>
      request<AuthUser>("/auth/me", {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      }),
  },

  admin: {
    overview: (token: string) => request<AdminOverview>("/admin/overview", { headers: authHeaders(token) }),

    users: (token: string, params: { q?: string; role?: string; active?: string }) => {
      const qs = new URLSearchParams();
      if (params.q) qs.set("q", params.q);
      if (params.role && params.role !== "all") qs.set("role", params.role);
      if (params.active && params.active !== "all") qs.set("active", params.active);
      return request<{ total: number; page: number; page_size: number; users: AdminUser[] }>(
        `/admin/users?${qs.toString()}`,
        { headers: authHeaders(token) },
      );
    },

    setUserStatus: (token: string, userId: number, isActive: boolean) =>
      request<AdminUser>(`/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ is_active: isActive }),
      }),

    setUserRole: (token: string, userId: number, role: string) =>
      request<AdminUser>(`/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ role }),
      }),

    submissions: (token: string, status = "pending") =>
      request<AdminSubmission[]>(`/admin/content/submissions?status=${encodeURIComponent(status)}`, {
        headers: authHeaders(token),
      }),

    reviewSubmission: (token: string, id: number, decision: "approve" | "reject", note: string) =>
      request<AdminSubmission>(`/admin/content/submissions/${id}/${decision}`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ note }),
      }),

    activity: (token: string) => request<AdminActivity[]>("/admin/activity?limit=100", { headers: authHeaders(token) }),

    feedback: (token: string) => request<AdminFeedback[]>("/admin/feedback", { headers: authHeaders(token) }),
  },

  content: {
    submit: (token: string, payload: {
      content_type: "dataset" | "curriculum";
      source_language_code: string;
      target_language_code: string;
      source_text: string;
      target_text: string;
      category?: string;
      source_citation?: string;
      license?: string;
    }) =>
      request<AdminSubmission>("/content/submissions", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      }),
  },
};