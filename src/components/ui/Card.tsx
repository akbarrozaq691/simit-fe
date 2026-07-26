export function Card({
  padded = true,
  className = '',
  children,
}: {
  padded?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl bg-white ring-1 ring-ink-200 shadow-sm ${padded ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}
