import { ApiError } from '@/api/client'

/** The backend's COI rejection, e.g.
 *  "conflict of interest: reviewer <uuid> shares the author's institution
 *   (Institut Beta); pass override_coi=true to assign anyway"
 *
 *  It names the API flag and the reviewer's UUID — neither of which means
 *  anything to an editor looking at a list of reviewer names with an
 *  "Override conflict of interest" checkbox right there. */
const COI_PATTERN =
  /reviewer\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+shares the author's institution\s*\(([^)]*)\)/i

export interface AssignError {
  /** Heading for the ErrorState — a deliberate COI refusal is not a fault. */
  title: string
  message: string
}

const GENERIC_TITLE = 'Something went wrong'

/**
 * Turns an assignment failure into something an editor can act on.
 *
 * For a conflict-of-interest 409 it swaps the reviewer's UUID for their name,
 * points at the checkbox instead of quoting the API flag, and titles the panel
 * for what it is rather than calling a working safety check a failure. Every
 * other error keeps the server's own wording — the backend's messages are
 * generally clear, and rewriting them wholesale would hide detail we don't
 * anticipate.
 */
export function assignErrorMessage(err: unknown, nameFor: (id: string) => string): AssignError {
  if (!(err instanceof ApiError)) {
    return { title: GENERIC_TITLE, message: 'Something went wrong. Please try again.' }
  }

  if (err.status === 409) {
    const match = err.message.match(COI_PATTERN)
    if (match) {
      const [, reviewerId, institution] = match
      const name = nameFor(reviewerId)
      const where = institution.trim()
      return {
        title: 'Conflict of interest',
        message:
          `${name} is at the same institution as the author` +
          (where ? ` (${where})` : '') +
          `. Tick “Override conflict of interest” below to assign them anyway.`,
      }
    }
  }

  return { title: GENERIC_TITLE, message: err.message }
}
