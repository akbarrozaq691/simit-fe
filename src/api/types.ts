export type Role = 'admin' | 'EIC' | 'SC' | 'author'

/** How a participant signed up. Null for accounts created before this existed
 *  (the seeded admin, and staff accounts an admin creates directly). */
export type RegisterAs = 'student' | 'general_presenter'

/** The three curated student levels. Their ids are fixed by the backend seed
 *  (db/schema.sql), so the form can offer them without a name lookup that an
 *  admin could rename out from under it. */
export const STUDENT_LEVELS = [
  { id: '11111111-1111-4111-8111-111111111111', label: 'Bachelor Student' },
  { id: '22222222-2222-4222-8222-222222222222', label: 'Master Student' },
  { id: '33333333-3333-4333-8333-333333333333', label: 'Doctoral Student' },
] as const

/** Internal statuses (EIC/SC/admin) plus the coarser values authors receive. */
export type ArticleStatus =
  | 'submitted'
  | 'assigned_to_sc'
  | 'abstract_review_complete'
  | 'abstract_accepted'
  | 'rejected'
  | 'full_paper_submitted'
  | 'full_paper_review_complete'
  | 'revision_needed'
  | 'accepted'
  | 'under_review'

export interface Article {
  id_article: string
  title: string
  authors: string
  abstract: string
  keywords: string | null
  abstract_file_path: string
  full_paper_file_path: string | null
  status: ArticleStatus
  id_user: string
  id_topic: string | null
  id_recommended_journal: string | null
  reviewers: string[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ArticleVersion {
  id_version: string
  id_article: string
  phase: 'abstract' | 'full_paper'
  version_number: number
  file_path: string
  submitted_by: string
  submitted_at: string
}

export interface Review {
  id_review: string
  id_version: string
  id_reviewer: string
  decision: 'accept' | 'reject' | 'revision'
  notes: string | null
  reviewed_at: string
}

export interface User {
  id_user: string
  user_name: string
  institution_name: string | null
  email: string
  phone_number: string | null
  created_at: string
  role: Role
  occupation_name: string | null
  register_as: RegisterAs | null
  deleted_at: string | null
}

export interface SubTopic {
  id_sub_topic: string
  name: string
  id_topic: string
}

export interface Topic {
  id_topic: string
  topic_name: string
  description: string | null
  sort_order: number
  stem: SubTopic[]
  humanity: SubTopic[]
  interdisciplinary: SubTopic[]
}

export interface Journal {
  id_journal: string
  journal_name: string
}

export interface Occupation {
  id_occupation: string
  occupation_name: string
}

export interface TimelineItem {
  id_timeline: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  created_at: string
}

export interface AuditEntry {
  id_audit: string
  id_actor: string | null
  action: string
  entity_type: string
  entity_id: string | null
  detail: Record<string, unknown> | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  id_user: string
  user_name: string
  role: Role
}

export interface UploadResponse {
  file_path: string
}

// ---- Landing page content (CMS) ----

export interface ScheduleItem {
  id_schedule: string
  title: string
  description: string | null
  /** Free text, not a date — organisers write ranges like "15 - 30 Juli 2026". */
  date_text: string | null
  sort_order: number
}

export interface FaqItem {
  id_faq: string
  question: string
  answer: string
  sort_order: number
}

export interface GalleryImage {
  id_image: string
  file_path: string
  caption: string | null
  sort_order: number
}

/** Everything the landing page renders, fetched in one request. */
export interface LandingContent {
  /** Single-value text, keyed as seeded in db/schema.sql (hero_title, …). */
  content: Record<string, string>
  schedule: ScheduleItem[]
  faq: FaqItem[]
  gallery: GalleryImage[]
  topics: Topic[]
  journals: Journal[]
}

export interface DownloadUrl {
  download_url: string
  /** Seconds the link stays valid. */
  expires_in: number
}
