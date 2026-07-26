import { forwardRef, type SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, hint, options, placeholder, className = '', ...rest },
  ref,
) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-800">{label}</span>
      <select
        ref={ref}
        {...rest}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 ${
          error ? 'border-rose-400' : 'border-ink-200'
        } ${className}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <span className="mt-1 block text-xs text-ink-600">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  )
})
