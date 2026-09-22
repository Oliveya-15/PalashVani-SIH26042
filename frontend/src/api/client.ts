import type {
  ChapterDetail,
  DatasetStatsResponse,
  FlashcardDeckResponse,
  GradeSummary,
  HealthResponse,
  Language,
  SearchResponse,
  TranslateResponse,
} from "@/types";

// In dev, Vite proxies /api -> http://127.0.0.1:8000 (see vite.config.ts), so
// the default of a relative "/api" works with zero configuration. Set
// VITE_API_BASE_URL only for a non-default backend location (e.g. production).
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
      headers: { "Content-Type": "application/json" },
      ...options,
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
};
