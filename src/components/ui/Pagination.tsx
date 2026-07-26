import { Button } from './Button'

export function Pagination({
  page,
  pageSize,
  count,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number
  pageSize: number
  /** Rows actually on this page — a partial page must not claim a full one. */
  count: number
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  const first = pageSize * (page - 1) + 1
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-ink-600">
        {count === 0 ? 'No results' : `Showing ${first}–${first + count - 1}`}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onPrev} disabled={page <= 1}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" onClick={onNext} disabled={!hasNext}>
          Next
        </Button>
      </div>
    </div>
  )
}
