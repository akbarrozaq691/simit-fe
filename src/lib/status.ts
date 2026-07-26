import type { ArticleStatus } from '@/api/types'

export type Tone = 'neutral' | 'progress' | 'milestone' | 'action' | 'success' | 'danger'

const LABELS: Record<ArticleStatus, string> = {
  submitted: 'Submitted',
  assigned_to_sc: 'Assigned to reviewers',
  abstract_review_complete: 'Abstract reviewed',
  abstract_accepted: 'Abstract accepted',
  rejected: 'Rejected',
  full_paper_submitted: 'Full paper under review',
  full_paper_review_complete: 'Full paper reviewed',
  revision_needed: 'Revision needed',
  accepted: 'Accepted',
  under_review: 'Under review',
}

const TONES: Record<ArticleStatus, Tone> = {
  submitted: 'neutral',
  assigned_to_sc: 'progress',
  abstract_review_complete: 'progress',
  full_paper_submitted: 'progress',
  full_paper_review_complete: 'progress',
  under_review: 'progress',
  abstract_accepted: 'milestone',
  revision_needed: 'action',
  accepted: 'success',
  rejected: 'danger',
}

export const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  progress: 'bg-amber-50 text-amber-800 ring-amber-200',
  milestone: 'bg-plum-50 text-plum-700 ring-plum-100',
  action: 'bg-brand-50 text-brand-700 ring-brand-100',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  danger: 'bg-rose-50 text-rose-800 ring-rose-200',
}

export function statusLabel(status: ArticleStatus): string {
  return LABELS[status] ?? status
}

export function statusTone(status: ArticleStatus): Tone {
  return TONES[status] ?? 'neutral'
}

/** Which review phase a reviewer form should target, or null if the article
 *  is not currently reviewable. Mirrors the backend's ABSTRACT_REVIEWABLE /
 *  FULL_PAPER_REVIEWABLE sets. */
export function phaseOf(status: ArticleStatus): 'abstract' | 'full_paper' | null {
  if (status === 'assigned_to_sc') return 'abstract'
  if (status === 'full_paper_submitted') return 'full_paper'
  return null
}
