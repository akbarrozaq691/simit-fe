import { useState } from 'react'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import type { ScheduleItem } from '@/api/types'

type Draft = { title: string; description: string; date_text: string; sort_order: string }

const BLANK: Draft = { title: '', description: '', date_text: '', sort_order: '0' }

function toDraft(item: ScheduleItem): Draft {
  return {
    title: item.title,
    description: item.description ?? '',
    date_text: item.date_text ?? '',
    sort_order: String(item.sort_order),
  }
}

/** Empty optional fields go back as null, not "", so the page's own
 *  "render this only when present" checks keep working. */
function toBody(draft: Draft) {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    date_text: draft.date_text.trim() || null,
    sort_order: Number(draft.sort_order) || 0,
  }
}

export function ScheduleEditor({
  items,
  onChanged,
}: {
  items: ScheduleItem[]
  onChanged: () => void
}) {
  const [editing, setEditing] = useState<ScheduleItem | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(BLANK)
  const [removing, setRemoving] = useState<ScheduleItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setEditing('new')
    setDraft(BLANK)
    setError(null)
  }

  function openEdit(item: ScheduleItem) {
    setEditing(item)
    setDraft(toDraft(item))
    setError(null)
  }

  async function handleSave() {
    if (!editing) return
    if (!draft.title.trim()) {
      setError('A title is required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (editing === 'new') await api.createSchedule(toBody(draft))
      else await api.updateSchedule(editing.id_schedule, toBody(draft))
      setEditing(null)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the entry.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!removing) return
    setBusy(true)
    setError(null)
    try {
      await api.deleteSchedule(removing.id_schedule)
      setRemoving(null)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the entry.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-plum-600">Timeline entries</h3>
          <p className="text-sm text-ink-600">
            Shown in order of the sort number, then alphabetically.
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          Add entry
        </Button>
      </div>

      {error && !editing && !removing && (
        <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>
      )}

      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No entries yet"
            description="Add the paper timeline milestones so authors know the deadlines."
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <li
              key={item.id_schedule}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-ink-200 p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink-900">
                  <span className="mr-2 text-xs text-ink-400">#{item.sort_order}</span>
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-1 text-sm text-ink-600">{item.description}</p>
                )}
                {item.date_text && (
                  <p className="mt-1 text-xs font-medium text-plum-500">{item.date_text}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setRemoving(item)
                    setError(null)
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add timeline entry' : 'Edit timeline entry'}
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <Textarea
            label="Description"
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
          <Input
            label="Date"
            hint='Free text, shown as typed — e.g. "1 Mar – 15 Apr 2026".'
            value={draft.date_text}
            onChange={(e) => setDraft((d) => ({ ...d, date_text: e.target.value }))}
          />
          <Input
            label="Sort order"
            type="number"
            value={draft.sort_order}
            onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
          />
        </div>
        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={busy}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal open={removing !== null} onClose={() => setRemoving(null)} title="Delete entry">
        <p className="text-sm text-ink-600">
          Delete <span className="font-semibold text-ink-900">{removing?.title}</span> from the
          timeline?
        </p>
        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={busy}>
            Delete
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
