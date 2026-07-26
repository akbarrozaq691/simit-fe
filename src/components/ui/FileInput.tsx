import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'accept'> {
  label: string
  error?: string
}

export const FileInput = forwardRef<HTMLInputElement, Props>(function FileInput(
  { label, error, className = '', onChange, id, ...rest },
  ref,
) {
  const [file, setFile] = useState<File | null>(null)
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1 block text-sm font-medium text-ink-800">{label}</span>
      <input
        id={inputId}
        ref={ref}
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null)
          onChange?.(e)
        }}
        {...rest}
        className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 file:mr-3 file:rounded-md file:border-0 file:bg-plum-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-plum-600 hover:file:bg-plum-100 ${
          error ? 'border-rose-400' : 'border-ink-200'
        } ${className}`}
      />
      {file && !error && (
        <span className="mt-1 block text-xs text-ink-600">
          {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
        </span>
      )}
      {!file && !error && <span className="mt-1 block text-xs text-ink-600">PDF only, up to 10 MB.</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  )
})
