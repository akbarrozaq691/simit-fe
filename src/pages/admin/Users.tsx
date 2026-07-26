import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import type { Tone } from '@/lib/status'
import type { Role, User } from '@/api/types'

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'EIC', label: 'Editor-in-Chief' },
  { value: 'SC', label: 'Reviewer (SC)' },
  { value: 'author', label: 'Author' },
]

const ROLE_TONE: Record<Role, Tone> = {
  admin: 'milestone',
  EIC: 'action',
  SC: 'progress',
  author: 'neutral',
}

interface FormState {
  user_name: string
  email: string
  password: string
  name_role: Role
  institution_name: string
  phone_number: string
  occupation_name: string
}

const EMPTY_FORM: FormState = {
  user_name: '',
  email: '',
  password: '',
  name_role: 'author',
  institution_name: '',
  phone_number: '',
  occupation_name: '',
}

export function Users() {
  const queryClient = useQueryClient()
  const [showArchived, setShowArchived] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [archiving, setArchiving] = useState<User | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archivingBusy, setArchivingBusy] = useState(false)

  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: ['users', showArchived],
    queryFn: () => api.listUsers(showArchived),
  })
  const occupationsQuery = useQuery({ queryKey: ['occupations'], queryFn: api.listOccupations })

  function openCreate() {
    setForm(EMPTY_FORM)
    setCreateError(null)
    setCreateOpen(true)
  }

  async function handleCreate() {
    if (!form.user_name.trim() || !form.email.trim() || !form.password) return
    setCreateError(null)
    setCreating(true)
    try {
      await api.createUser({
        user_name: form.user_name.trim(),
        email: form.email.trim(),
        password: form.password,
        name_role: form.name_role,
        institution_name: form.institution_name.trim() || null,
        phone_number: form.phone_number.trim() || null,
        occupation_name: form.occupation_name.trim() || null,
      })
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  async function handleArchive() {
    if (!archiving) return
    setArchiveError(null)
    setArchivingBusy(true)
    try {
      await api.deleteUser(archiving.id_user)
      setArchiving(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      setArchiveError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setArchivingBusy(false)
    }
  }

  async function handleRestore(user: User) {
    setRestoreError(null)
    setRestoringId(user.id_user)
    try {
      await api.restoreUser(user.id_user)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      setRestoreError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setRestoringId(null)
    }
  }

  const users = usersQuery.data ?? []

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <PageHeader
        title="Users"
        description="Manage accounts and roles."
        actions={<Button onClick={openCreate}>Create user</Button>}
      />

      <label className="flex w-fit items-center gap-2 text-sm font-medium text-ink-700">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="h-4 w-4 rounded border-ink-300"
        />
        Show archived
      </label>

      {restoreError && <ErrorState message={restoreError} />}

      {usersQuery.isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-plum-500" />
        </div>
      )}

      {usersQuery.isError && (
        <ErrorState
          message={usersQuery.error instanceof ApiError ? usersQuery.error.message : 'Could not load users.'}
          onRetry={() => usersQuery.refetch()}
        />
      )}

      {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
        <EmptyState title="No users found" description="Create one above." />
      )}

      {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 && (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Role</TH>
              <TH>Institution</TH>
              <TH>Occupation</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {users.map((user) => {
              const archived = user.deleted_at !== null
              return (
                <TR key={user.id_user}>
                  <TD className="font-medium text-ink-900">{user.user_name}</TD>
                  <TD>{user.email}</TD>
                  <TD>
                    <Badge tone={ROLE_TONE[user.role]}>{user.role}</Badge>
                  </TD>
                  <TD>{user.institution_name ?? '—'}</TD>
                  <TD>{user.occupation_name ?? '—'}</TD>
                  <TD>
                    <Badge tone={archived ? 'danger' : 'success'}>{archived ? 'Archived' : 'Active'}</Badge>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      {archived ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRestore(user)}
                          loading={restoringId === user.id_user}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setArchiving(user)
                            setArchiveError(null)
                          }}
                        >
                          Archive
                        </Button>
                      )}
                    </div>
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create user">
        <div className="flex flex-col gap-4">
          {createError && <ErrorState message={createError} />}
          <Input
            label="Name"
            value={form.user_name}
            onChange={(e) => setForm({ ...form, user_name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Role"
            value={form.name_role}
            onChange={(e) => setForm({ ...form, name_role: e.target.value as Role })}
            options={ROLE_OPTIONS}
          />
          <Input
            label="Institution"
            hint="Optional"
            value={form.institution_name}
            onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
          />
          <Input
            label="Phone number"
            hint="Optional"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          />
          {occupationsQuery.isLoading ? (
            <div className="text-sm text-ink-600">Loading occupations…</div>
          ) : (
            <Select
              label="Occupation"
              hint="Optional"
              placeholder="No occupation"
              value={form.occupation_name}
              onChange={(e) => setForm({ ...form, occupation_name: e.target.value })}
              options={(occupationsQuery.data ?? []).map((o) => ({
                value: o.occupation_name,
                label: o.occupation_name,
              }))}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={creating}
              disabled={!form.user_name.trim() || !form.email.trim() || !form.password}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!archiving} onClose={() => setArchiving(null)} title="Archive user">
        <div className="flex flex-col gap-4">
          {archiveError && <ErrorState message={archiveError} />}
          <p className="text-sm text-ink-700">
            Archive <span className="font-semibold">{archiving?.user_name}</span>?
          </p>
          <p className="text-sm text-ink-600">
            They will be signed out immediately — every authenticated request checks whether the account is
            still active, rather than waiting for their session to expire. Their email address stays reserved,
            so they cannot re-register with it; an admin can restore the account later to give it back.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setArchiving(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleArchive} loading={archivingBusy}>
              Archive
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
