import type { ArticleStatus } from '@/api/types'

const STEPS = [
  'Submitted',
  'Abstract review',
  'Abstract accepted',
  'Full paper review',
  'Final decision',
] as const

/** Index of each status within the 5-step pipeline. `under_review` is the
 *  coarse author-facing status the API maps both abstract-review and
 *  full-paper-review states to (see backend `AUTHOR_STATUS_MAP`) — without
 *  finer detail we place it at the earliest step it could represent. */
const STEP_INDEX: Record<Exclude<ArticleStatus, 'rejected'>, number> = {
  submitted: 0,
  assigned_to_sc: 1,
  abstract_review_complete: 1,
  under_review: 1,
  abstract_accepted: 2,
  full_paper_submitted: 3,
  full_paper_review_complete: 3,
  revision_needed: 3,
  accepted: 4,
}

type StepState = 'done' | 'current' | 'upcoming'

export function ArticleStatusStepper({ status }: { status: ArticleStatus }) {
  const rejected = status === 'rejected'
  const currentIndex = rejected ? -1 : STEP_INDEX[status]

  return (
    <div>
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-2">
        {STEPS.map((label, i) => {
          const state: StepState = rejected
            ? 'upcoming'
            : i < currentIndex
              ? 'done'
              : i === currentIndex
                ? 'current'
                : 'upcoming'
          return (
            <li key={label} className="flex flex-1 items-center gap-2 sm:flex-col sm:items-stretch">
              <div className="flex items-center gap-2 sm:flex-col">
                <span
                  className={
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                    (state === 'done'
                      ? 'bg-emerald-500 text-white'
                      : state === 'current'
                        ? 'bg-brand-500 text-white'
                        : 'bg-ink-100 text-ink-500')
                  }
                >
                  {state === 'done' ? '✓' : i + 1}
                </span>
                <span
                  className={`text-xs font-medium sm:mt-1 sm:text-center ${
                    state === 'upcoming' ? 'text-ink-500' : 'text-ink-800'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <span className="hidden h-px flex-1 bg-ink-200 sm:block" />}
            </li>
          )
        })}
      </ol>
      {rejected && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 ring-1 ring-rose-200">
          This submission was not accepted. No further steps in the pipeline apply.
        </p>
      )}
    </div>
  )
}
