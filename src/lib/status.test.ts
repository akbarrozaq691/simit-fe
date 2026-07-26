import { describe, expect, it } from 'vitest'
import { phaseOf, statusLabel, statusTone } from './status'
import type { ArticleStatus } from '@/api/types'

const ALL: ArticleStatus[] = [
  'submitted', 'assigned_to_sc', 'abstract_review_complete', 'abstract_accepted',
  'rejected', 'full_paper_submitted', 'full_paper_review_complete',
  'revision_needed', 'accepted', 'under_review',
]

describe('statusLabel', () => {
  it('gives every status a human label', () => {
    for (const s of ALL) {
      expect(statusLabel(s)).toBeTruthy()
      expect(statusLabel(s)).not.toContain('_')
    }
  })
})

describe('statusTone', () => {
  it('maps by pipeline meaning', () => {
    expect(statusTone('submitted')).toBe('neutral')
    expect(statusTone('assigned_to_sc')).toBe('progress')
    expect(statusTone('abstract_review_complete')).toBe('progress')
    expect(statusTone('full_paper_submitted')).toBe('progress')
    expect(statusTone('full_paper_review_complete')).toBe('progress')
    expect(statusTone('under_review')).toBe('progress')
    expect(statusTone('abstract_accepted')).toBe('milestone')
    expect(statusTone('revision_needed')).toBe('action')
    expect(statusTone('accepted')).toBe('success')
    expect(statusTone('rejected')).toBe('danger')
  })

  it('covers every status', () => {
    for (const s of ALL) expect(statusTone(s)).toBeTruthy()
  })
})

describe('phaseOf', () => {
  it('identifies which phase a reviewer form should target', () => {
    expect(phaseOf('assigned_to_sc')).toBe('abstract')
    expect(phaseOf('full_paper_submitted')).toBe('full_paper')
  })

  it('returns null when the article is not reviewable', () => {
    expect(phaseOf('submitted')).toBeNull()
    expect(phaseOf('abstract_accepted')).toBeNull()
    expect(phaseOf('accepted')).toBeNull()
    expect(phaseOf('rejected')).toBeNull()
  })
})
