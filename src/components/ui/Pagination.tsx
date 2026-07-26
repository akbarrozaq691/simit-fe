import { Button } from './Button'

export function Pagination({
  page,
  pageSize,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number
  pageSize: number
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-ink-600">
        Showing {pageSize * (page - 1) + 1}–{pageSize * page}
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
