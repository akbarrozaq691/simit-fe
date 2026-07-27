import { useRef, useState } from 'react'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { FileInput } from '@/components/ui/FileInput'
import { Spinner } from '@/components/ui/Spinner'

/** Storage may not be configured in an environment yet, and the backend can
 *  only answer that with a 500. Say so plainly rather than "Request failed". */
export function uploadErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 500) {
      return 'Image storage is not configured on the server yet, so uploads cannot be saved.'
    }
    return err.message
  }
  return 'Could not upload the image.'
}

/**
 * Picks a file, uploads it, and hands the stored path to the caller.
 *
 * Upload and registration are two steps on the server (the same shape as
 * paper submission), so this component owns only the first: what the path is
 * then used for — a hero background, a gallery row — is the caller's business.
 */
export function ImageUpload({
  label,
  onUploaded,
}: {
  label: string
  onUploaded: (path: string) => Promise<void> | void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const { file_path } = await api.uploadImage(file)
      await onUploaded(file_path)
      // Clear the picker so choosing the same file again still fires onChange.
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(uploadErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <FileInput
        ref={inputRef}
        label={label}
        accept="image/png,image/jpeg,image/webp,image/gif"
        hint="PNG, JPEG, WebP or GIF, up to 10 MB."
        disabled={busy}
        onChange={handleChange}
        error={error ?? undefined}
      />
      {busy && (
        <p className="mt-2 flex items-center gap-2 text-xs text-ink-600">
          <Spinner className="h-3.5 w-3.5 text-plum-500" /> Uploading…
        </p>
      )}
    </div>
  )
}
