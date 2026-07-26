import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import type { Occupation } from '@/api/types'

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

export function Occupations() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['occupations'], queryFn: api.listOccupations })

  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [editing, setEditing] = useState<Occupation | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const [removing, setRemoving] = useState<Occupation | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['occupations'] })
  }

  async function handleCreate() {
    if (!newName.trim()) {
      setCreateError('Enter an occupation name.')
      return
    }
    setBusy(true)
    setCreateError(null)
    try {
      await api.createOccupation(newName.trim())
      setNewName('')
      invalidate()
    } catch (err) {
      setCreateError(errorMessage(err, 'Could not create the occupation.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate() {
    if (!editing) return
    setBusy(true)
    setEditError(null)
    try {
      await api.updateOccupation(editing.id_occupation, editName.trim())
      setEditing(null)
      invalidate()
    } catch (err) {
      setEditError(errorMessage(err, 'Could not rename the occupation.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!removing) return
    setBusy(true)
    setRemoveError(null)
    try {
      await api.deleteOccupation(removing.id_occupation)
      setRemoving(null)
      invalidate()
    } catch (err) {
      setRemoveError(errorMessage(err, 'Could not delete the occupation.'))
    } finally {
      setBusy(false)
    }
  }

  const occupations = query.data ?? []

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader
        title="Occupations"
        description="This list gates self-registration — applicants can only choose an occupation that already exists here, so removing one narrows who is able to register."
      />

      <Card className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="New occupation"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Dosen"
              error={createError ?? undefined}
            />
          </div>
          <Button onClick={handleCreate} loading={busy}>
            Add
          </Button>
        </div>
      </Card>

      <div className="mt-6">
        {query.isLoading && (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-plum-500" />
          </div>
        )}

        {query.isError && (
          <ErrorState
            message={errorMessage(query.error, 'Could not load occupations.')}
            onRetry={() => query.refetch()}
          />
        )}

        {!query.isLoading && !query.isError && occupations.length === 0 && (
          <EmptyState
            title="No occupations yet"
            description="Add at least one, otherwise nobody can complete registration."
          />
        )}

        {!query.isLoading && !query.isError && occupations.length > 0 && (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {occupations.map((o) => (
                <TR key={o.id_occupation}>
                  <TD className="font-medium text-ink-900">{o.occupation_name}</TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditing(o)
                          setEditName(o.occupation_name)
                          setEditError(null)
                        }}
                      >
                        Rename
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setRemoving(o)
                          setRemoveError(null)
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
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Rename occupation">
        <Input
          label="Name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          error={editError ?? undefined}
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} loading={busy}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal open={removing !== null} onClose={() => setRemoving(null)} title="Delete occupation">
        <p className="text-sm text-ink-600">
          Delete <span className="font-semibold text-ink-900">{removing?.occupation_name}</span>? New
          applicants will no longer be able to select it during registration.
        </p>
        {removeError && <p className="mt-3 text-sm font-medium text-rose-600">{removeError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={busy}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
