import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, error, hint, className = '', ...rest },
  ref,
) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-800">{label}</span>
      <textarea
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
