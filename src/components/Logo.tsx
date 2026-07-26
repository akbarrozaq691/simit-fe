/** Placeholder mark — swap this one file for the real SIMIT asset. */
export function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="SIMIT logo">
      <rect width="40" height="40" rx="9" fill="#922B67" />
      <path d="M11 27c3.6 2.2 8.4 2.2 12 0" stroke="#E1723D" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="16" r="6.5" fill="#E1723D" />
      <circle cx="20" cy="16" r="2.5" fill="#922B67" />
    </svg>
  )
}
