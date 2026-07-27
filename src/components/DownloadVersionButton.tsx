import { useState } from 'react'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'

/** Turns the backend's failure modes into something an organiser can act on. */
export function downloadErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 500) return 'File storage is not configured on the server.'
    if (err.status === 409) {
      return 'This file was uploaded before the current storage was set up, so it cannot be opened. The author needs to submit it again.'
    }
    if (err.status === 404) return 'That version no longer exists.'
    return err.message
  }
  return 'Could not open the file.'
}

/**
 * Opens one version's PDF.
 *
 * Papers are stored privately, so there is no URL to link to directly — the
 * server checks permission and mints a short-lived one per click. The blank tab
 * is opened synchronously, before the request: a `window.open` that happens
 * after an `await` has lost the user's click and gets blocked as a popup.
 */
export function DownloadVersionButton({
  idArticle,
  idVersion,
  label = 'Open PDF',
}: {
  idArticle: string
  idVersion: string
  label?: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setBusy(true)
    setError(null)
    const tab = window.open('', '_blank')
    try {
      const { download_url } = await api.getVersionDownloadUrl(idArticle, idVersion)
      if (tab) tab.location.href = download_url
      // A blocked popup would leave the file unreachable, so fall back to this
      // tab rather than failing silently.
      else window.location.href = download_url
    } catch (err) {
      tab?.close()
      setError(downloadErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={handleClick} loading={busy}>
        {label}
      </Button>
      {error && <p className="mt-1 max-w-xs text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}
