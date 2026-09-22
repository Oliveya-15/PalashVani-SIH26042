// Mirrors backend/app/schemas/schemas.py -- kept in sync by hand since this
// is a small academic prototype without a codegen pipeline (see
// docs/api.md "Why this approach" for the trade-off discussion).

export interface Language {
  id: number;
  code: string;
  name_en: string;
  name_hi: string;
  script: string;
  is_tribal: boolean;
  status: "active" | "planned";
  bhashini_supported: boolean;
}

export interface AlternativeSuggestion {
  text: string;
  similarity: number;
}

export type TranslationMethod = "exact" | "normalized" | "fuzzy" | "semantic" | "external_bhashini" | "none";
export type ConfidenceLabel = "high" | "medium" | "low" | "none";

export interface TranslateResponse {
  input_text: string;
  normalized_input: string;
  result_text: string | null;
  method: TranslationMethod;
  confidence: number;
  confidence_label: ConfidenceLabel;
  verified: boolean;
  ai_assisted: boolean;
  message: string;
  category: string | null;
  transliteration: string | null;
  source_citation: string | null;
  alternatives: AlternativeSuggestion[];
  history_id: number | null;
}

export interface SearchResultItem {
  id: number;
  source_text: string;
  target_text: string;
  category: string;
  transliteration: string;
  source_citation: string;
  verified: boolean;
  match_type: "exact" | "contains";
}

export interface SearchResponse {
  query: string;
  total: number;
  page: number;
  page_size: number;
  results: SearchResultItem[];
}

export interface DatasetStatsItem {
  language_code: string;
  language_name_en: string;
  language_name_hi: string;
  total_pairs: number;
  source: string;
  license: string;
  coverage_note: string;
  last_updated: string;
  status: "active" | "planned";
}

export interface DatasetStatsResponse {
  generated_at: string;
  total_verified_pairs: number;
  languages: DatasetStatsItem[];
  category_breakdown: Record<string, number>;
}

export interface ChapterSummary {
  id: number;
  title_en: string;
  title_hi: string;
  order_index: number;
  unit_count: number;
}

export interface SubjectSummary {
  id: number;
  name_en: string;
  name_hi: string;
  icon: string;
  chapters: ChapterSummary[];
}

export interface GradeSummary {
  id: number;
  grade_number: number;
  label_en: string;
  label_hi: string;
  subjects: SubjectSummary[];
}

export interface ContentUnit {
  id: number;
  source_text: string;
  target_text: string;
  transliteration: string;
  category: string;
  verified: boolean;
}

export interface ChapterDetail {
  id: number;
  title_en: string;
  title_hi: string;
  subject_name_en: string;
  grade_number: number;
  units: ContentUnit[];
}

export interface Flashcard {
  id: number;
  source_text: string;
  target_text: string;
  transliteration: string;
  category: string;
}

export interface FlashcardDeckResponse {
  category: string;
  total: number;
  cards: Flashcard[];
}

export interface HealthResponse {
  status: string;
  app_env: string;
  semantic_search_available: boolean;
}

export type UiLanguage = "en" | "hi";
export type Theme = "light" | "dark";
