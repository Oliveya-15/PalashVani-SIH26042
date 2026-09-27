// Mirrors backend/app/schemas/admin_schemas.py and auth_schemas.py by
// hand, the same trade-off already documented in the main frontend's
// src/types/index.ts.

export type UserRole = "teacher" | "student" | "admin";

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  school_name: string;
  district: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AdminUser;
}

export interface AdminUserRow {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  school_name: string;
  district: string;
  is_active: boolean;
  created_at: string;
  translation_count: number;
  feedback_count: number;
}

export interface AdminUserListResponse {
  total: number;
  page: number;
  page_size: number;
  users: AdminUserRow[];
}

export interface AdminUserUpdatePayload {
  is_active?: boolean;
  role?: UserRole;
  school_name?: string;
  district?: string;
}

export interface AdminDatasetEntry {
  id: number;
  source_text: string;
  target_text: string;
  category: string;
  transliteration: string;
  source_citation: string;
  verified: boolean;
  rights_cleared: boolean;
  rights_note: string;
  target_language_code: string;
}

export interface AdminDatasetEntryListResponse {
  total: number;
  page: number;
  page_size: number;
  entries: AdminDatasetEntry[];
}

export interface AdminDatasetEntryCreatePayload {
  source_text: string;
  target_text: string;
  target_language_code: string;
  category: string;
  transliteration: string;
  source_citation: string;
  verified: boolean;
  rights_cleared: boolean;
  rights_note: string;
}

export interface AdminDatasetEntryUpdatePayload {
  target_text?: string;
  category?: string;
  transliteration?: string;
  source_citation?: string;
  verified?: boolean;
  rights_cleared?: boolean;
  rights_note?: string;
}

export interface RoleBreakdown {
  teacher: number;
  student: number;
  admin: number;
}

export interface DashboardStats {
  generated_at: string;
  total_users: number;
  users_by_role: RoleBreakdown;
  active_users_7d: number;
  total_translations_served: number;
  translations_last_7d: number;
  total_dataset_entries: number;
  entries_pending_rights_clearance: number;
  total_feedback: number;
  unread_feedback_note: string;
}

export interface AdminFeedbackItem {
  id: number;
  message: string;
  rating: number | null;
  page: string;
  user_full_name: string | null;
  user_email: string | null;
  created_at: string;
}

export interface AdminFeedbackListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AdminFeedbackItem[];
}

export interface AuditLogItem {
  id: number;
  admin_user_id: number;
  admin_name: string | null;
  action: string;
  target_type: string;
  target_id: number | null;
  details: string;
  created_at: string;
}

export interface AuditLogListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AuditLogItem[];
}
