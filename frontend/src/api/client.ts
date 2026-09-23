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
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      // FIXED: headers must be merged *inside* one object -- spreading
      // ...options after a separate `headers:` key would silently drop
      // Content-Type whenever a caller (e.g. an authenticated request)
      // also passes its own headers, since the later `...options` spread
      // used to replace the whole `headers` object instead of merging
      // into it. This form always merges correctly, and every existing
      // call site (which passes no custom headers) behaves exactly as
      // before.
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
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
};
