import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import type { TimelineItem } from '@/api/types'

/** `datetime-local` inputs work in "YYYY-MM-DDTHH:mm" local time — convert
 *  to/from ISO strings for the API at the boundary. */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toIso(local: string): string {
  return new Date(local).toISOString()
}

interface FormState {
  title: string
  description: string
  start_date: string
  end_date: string
}

const EMPTY_FORM: FormState = { title: '', description: '', start_date: '', end_date: '' }

export function TimelineAdmin() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [editing, setEditing] = useState<TimelineItem | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState<TimelineItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['timeline'],
    queryFn: api.listTimeline,
  })

  async function handleCreate() {
    if (!form.title.trim() || !form.start_date || !form.end_date) return
    setCreateError(null)
    setCreating(true)
    try {
      await api.createTimeline({
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date: toIso(form.start_date),
        end_date: toIso(form.end_date),
      })
      setForm(EMPTY_FORM)
      await queryClient.invalidateQueries({ queryKey: ['timeline'] })
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  function openEdit(item: TimelineItem) {
    setEditing(item)
    setEditForm({
      title: item.title,
      description: item.description ?? '',
      start_date: toLocalInput(item.start_date),
      end_date: toLocalInput(item.end_date),
    })
    setEditError(null)
  }

  async function handleSaveEdit() {
    if (!editing || !editForm.title.trim() || !editForm.start_date || !editForm.end_date) return
    setEditError(null)
    setSaving(true)
    try {
      await api.updateTimeline(editing.id_timeline, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        start_date: toIso(editForm.start_date),
        end_date: toIso(editForm.end_date),
      })
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['timeline'] })
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteError(null)
    setRemoving(true)
    try {
      await api.deleteTimeline(deleting.id_timeline)
      setDeleting(null)
      await queryClient.invalidateQueries({ queryKey: ['timeline'] })
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <PageHeader title="Timeline" description="Key dates shown to authors and reviewers." />

      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-ink-200">
        <h2 className="text-sm font-semibold text-ink-800">Add timeline item</h2>
        {createError && <ErrorState message={createError} />}
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea
          label="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Start"
            type="datetime-local"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
          <Input
            label="End"
            type="datetime-local"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />
        </div>
        <Button
          onClick={handleCreate}
          loading={creating}
          disabled={!form.title.trim() || !form.start_date || !form.end_date}
          className="self-start"
        >
          Add
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-plum-500" />
        </div>
      )}

      {isError && (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Could not load the timeline.'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <EmptyState title="No timeline items yet" description="Add one above." />
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <Table>
          <THead>
            <TR>
              <TH>Title</TH>
              <TH>Start</TH>
              <TH>End</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {data!.map((item) => (
              <TR key={item.id_timeline}>
                <TD className="font-medium text-ink-900">{item.title}</TD>
                <TD>{new Date(item.start_date).toLocaleString()}</TD>
                <TD>{new Date(item.end_date).toLocaleString()}</TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setDeleting(item)
                        setDeleteError(null)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit timeline item">
        <div className="flex flex-col gap-4">
          {editError && <ErrorState message={editError} />}
          <Input label="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          <Textarea
            label="Description (optional)"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start"
              type="datetime-local"
              value={editForm.start_date}
              onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
            />
            <Input
              label="End"
              type="datetime-local"
              value={editForm.end_date}
              onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              loading={saving}
              disabled={!editForm.title.trim() || !editForm.start_date || !editForm.end_date}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete timeline item">
        <div className="flex flex-col gap-4">
          {deleteError && <ErrorState message={deleteError} />}
          <p className="text-sm text-ink-700">
            Delete <span className="font-semibold">{deleting?.title}</span>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={removing}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
