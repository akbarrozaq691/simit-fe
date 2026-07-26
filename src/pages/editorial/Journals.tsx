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
import type { Journal } from '@/api/types'

export function Journals() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [editing, setEditing] = useState<Journal | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState<Journal | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['journals'],
    queryFn: api.listJournals,
  })

  async function handleCreate() {
    if (!name.trim()) return
    setCreateError(null)
    setCreating(true)
    try {
      await api.createJournal(name.trim())
      setName('')
      await queryClient.invalidateQueries({ queryKey: ['journals'] })
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  function openEdit(journal: Journal) {
    setEditing(journal)
    setEditName(journal.journal_name)
    setEditError(null)
  }

  async function handleSaveEdit() {
    if (!editing || !editName.trim()) return
    setEditError(null)
    setSaving(true)
    try {
      await api.updateJournal(editing.id_journal, editName.trim())
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['journals'] })
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
      await api.deleteJournal(deleting.id_journal)
      setDeleting(null)
      await queryClient.invalidateQueries({ queryKey: ['journals'] })
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <PageHeader title="Journals" description="Recommended journals offered when announcing full-paper acceptance." />

      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-ink-200">
        <h2 className="text-sm font-semibold text-ink-800">Add journal</h2>
        {createError && <ErrorState message={createError} />}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              label="Journal name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Journal of Applied Computing"
            />
          </div>
          <Button onClick={handleCreate} loading={creating} disabled={!name.trim()} className="self-end">
            Add
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-plum-500" />
        </div>
      )}

      {isError && (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Could not load journals.'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <EmptyState title="No journals yet" description="Add one above to make it available for announcements." />
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {data!.map((journal) => (
              <TR key={journal.id_journal}>
                <TD className="font-medium text-ink-900">{journal.journal_name}</TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(journal)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setDeleting(journal)
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit journal">
        <div className="flex flex-col gap-4">
          {editError && <ErrorState message={editError} />}
          <Input label="Journal name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={saving} disabled={!editName.trim()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete journal">
        <div className="flex flex-col gap-4">
          {deleteError && <ErrorState message={deleteError} />}
          <p className="text-sm text-ink-700">
            Delete <span className="font-semibold">{deleting?.journal_name}</span>? This cannot be undone.
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
