import { forwardRef, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, className = '', ...rest },
  ref,
) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-800">{label}</span>
      <input
        ref={ref}
        {...rest}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 ${
          error ? 'border-rose-400' : 'border-ink-200'
        } ${className}`}
      />
      {hint && !error && <span className="mt-1 block text-xs text-ink-600">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  )
})
