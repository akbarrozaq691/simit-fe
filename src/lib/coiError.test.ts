import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/client'
import { assignErrorMessage } from './coiError'

const REVIEWER_ID = '4e346879-3209-4220-a05d-a3a92615e8c9'
const nameFor = (id: string) => (id === REVIEWER_ID ? 'Dr. Ayşe Yılmaz' : id)

/** Verbatim shape the backend produces (src/routers/articles/router.py). */
const coiMessage =
  `conflict of interest: reviewer ${REVIEWER_ID} shares the author's institution ` +
  `(Universitas Alpha); pass override_coi=true to assign anyway`

describe('assignErrorMessage', () => {
  it('replaces the reviewer UUID with their name', () => {
    const out = assignErrorMessage(new ApiError(409, coiMessage), nameFor).message
    expect(out).toContain('Dr. Ayşe Yılmaz')
    expect(out).not.toContain(REVIEWER_ID)
  })

  it('keeps the institution so the editor knows why', () => {
    const out = assignErrorMessage(new ApiError(409, coiMessage), nameFor).message
    expect(out).toContain('Universitas Alpha')
  })

  it('points at the checkbox instead of the API flag', () => {
    const out = assignErrorMessage(new ApiError(409, coiMessage), nameFor).message
    expect(out).toContain('Override conflict of interest')
    expect(out).not.toContain('override_coi')
  })

  it('tolerates the untrimmed institution values the backend can echo back', () => {
    const padded = coiMessage.replace('(Universitas Alpha)', '(   universitas ALPHA   )')
    const out = assignErrorMessage(new ApiError(409, padded), nameFor).message
    expect(out).toContain('(universitas ALPHA)')
  })

  it('falls back to the reviewer id when the name is unknown', () => {
    const unknown = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    const msg = coiMessage.replace(REVIEWER_ID, unknown)
    const out = assignErrorMessage(new ApiError(409, msg), nameFor).message
    expect(out).toContain(unknown)
  })

  it('leaves other 409s untouched — they are already readable', () => {
    const other = new ApiError(409, 'cannot assign reviewers in status accepted')
    expect(assignErrorMessage(other, nameFor).message).toBe('cannot assign reviewers in status accepted')
  })

  it('leaves non-409 errors untouched', () => {
    const bad = new ApiError(400, 'does not belong to a SC user')
    expect(assignErrorMessage(bad, nameFor).message).toBe('does not belong to a SC user')
  })

  it('gives a generic message for non-API failures', () => {
    expect(assignErrorMessage(new TypeError('network down'), nameFor).message).toBe(
      'Something went wrong. Please try again.',
    )
  })

  it('titles a COI refusal for what it is, not as a fault', () => {
    expect(assignErrorMessage(new ApiError(409, coiMessage), nameFor).title).toBe(
      'Conflict of interest',
    )
  })

  it('keeps the generic title for real failures', () => {
    expect(assignErrorMessage(new ApiError(400, 'bad'), nameFor).title).toBe('Something went wrong')
  })
})
