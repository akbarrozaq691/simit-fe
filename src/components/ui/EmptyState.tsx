export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-200 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      {description && <p className="text-sm text-ink-600">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
