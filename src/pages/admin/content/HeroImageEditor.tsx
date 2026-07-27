import { useState } from 'react'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { HERO_IMAGE_KEY } from '@/lib/contentFields'
import { ImageUpload } from './ImageUpload'

/** The hero background. Stored as a content key like the copy around it, but
 *  set by upload rather than typed — a hand-edited storage path is a broken
 *  hero image nobody notices until a visitor does. */
export function HeroImageEditor({
  path,
  onChanged,
}: {
  path: string
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUploaded(uploaded: string) {
    await api.saveContent({ [HERO_IMAGE_KEY]: uploaded })
    onChanged()
  }

  async function handleClear() {
    setBusy(true)
    setError(null)
    try {
      await api.saveContent({ [HERO_IMAGE_KEY]: '' })
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not clear the image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <h3 className="font-semibold text-plum-600">Background image</h3>
      <p className="text-sm text-ink-600">
        Sits behind the title under a plum overlay. With none set, the hero uses a plum gradient.
      </p>

      {path && (
        <img
          src={path}
          alt=""
          className="mt-4 h-40 w-full rounded-lg bg-ink-50 object-cover"
        />
      )}

      <div className="mt-4">
        <ImageUpload label={path ? 'Replace image' : 'Upload image'} onUploaded={handleUploaded} />
      </div>

      {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

      {path && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={handleClear} loading={busy}>
          Use the gradient instead
        </Button>
      )}
    </Card>
  )
}
