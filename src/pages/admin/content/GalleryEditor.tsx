import { useState } from 'react'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ImageUpload } from './ImageUpload'
import type { GalleryImage } from '@/api/types'

export function GalleryEditor({
  images,
  onChanged,
}: {
  images: GalleryImage[]
  onChanged: () => void
}) {
  const [caption, setCaption] = useState('')
  const [removing, setRemoving] = useState<GalleryImage | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUploaded(path: string) {
    // Register straight away, using the caption typed before picking the file:
    // an uploaded-but-unregistered path is invisible in the UI and would just
    // sit in storage as an orphan.
    await api.createGalleryImage({
      file_path: path,
      caption: caption.trim() || null,
      sort_order: images.length,
    })
    setCaption('')
    onChanged()
  }

  async function handleDelete() {
    if (!removing) return
    setBusy(true)
    setError(null)
    try {
      await api.deleteGalleryImage(removing.id_image)
      setRemoving(null)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove the photo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <h3 className="font-semibold text-plum-600">Photos</h3>
      <p className="text-sm text-ink-600">
        The About section shows the first four, in sort order.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Input
          label="Caption (optional)"
          hint="Used as the image's alt text. Set it before choosing the file."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <ImageUpload label="Add a photo" onUploaded={handleUploaded} />
      </div>

      {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}

      {images.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No photos yet"
            description="The About section falls back to a placeholder until a photo is uploaded."
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image) => (
            <li key={image.id_image} className="overflow-hidden rounded-lg border border-ink-200">
              <img
                src={image.file_path}
                alt={image.caption ?? ''}
                className="h-32 w-full bg-ink-50 object-cover"
              />
              <div className="p-3">
                <p className="truncate text-xs text-ink-700">{image.caption || 'No caption'}</p>
                <Button
                  size="sm"
                  variant="danger"
                  className="mt-2 w-full"
                  onClick={() => {
                    setRemoving(image)
                    setError(null)
                  }}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={removing !== null} onClose={() => setRemoving(null)} title="Remove photo">
        <p className="text-sm text-ink-600">
          Remove this photo from the gallery? The file stays in storage.
        </p>
        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={busy}>
            Remove
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
