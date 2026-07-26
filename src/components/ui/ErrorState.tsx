import { Button } from './Button'

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-rose-800">{title}</p>
      <p className="text-sm text-rose-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
