import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'

/** The backend's fixed action vocabulary (src/audit.py). Kept in sync by hand —
 *  the API has no endpoint that enumerates it. */
const ACTIONS = [
  'article.created',
  'article.status_changed',
  'article.deleted',
  'article.restored',
  'article.version_submitted',
  'reviewer.assigned',
  'reviewer.unassigned',
  'review.submitted',
  'user.created',
  'user.deleted',
  'user.restored',
]

/** Fixed at 50: the API accepts 1..200 and rejects anything outside with 422. */
const PAGE_SIZE = 50

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDetail(detail: Record<string, unknown> | null): string {
  if (!detail || Object.keys(detail).length === 0) return '—'
  return Object.entries(detail)
    .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('  ')
}

export function AuditLog() {
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [entityId, setEntityId] = useState('')
  const [actor, setActor] = useState('')
  const [page, setPage] = useState(1)

  // Archived users still appear as actors in history, so include them.
  const usersQuery = useQuery({
    queryKey: ['users', true],
    queryFn: () => api.listUsers(true),
  })

  const filters = {
    entity_type: entityType || undefined,
    action: action || undefined,
    entity_id: entityId.trim() || undefined,
    id_actor: actor || undefined,
  }

  const query = useQuery({
    queryKey: ['audit', filters, page],
    queryFn: () =>
      api.listAudit({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
  })

  const rows = query.data ?? []
  // No total-count endpoint exists, so a full page implies there may be more.
  const hasNext = rows.length === PAGE_SIZE

  const actorName = (id: string | null): string => {
    if (!id) return 'system'
    const user = usersQuery.data?.find((u) => u.id_user === id)
    return user ? user.user_name : id
  }

  function resetTo(fn: () => void) {
    fn()
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        title="Audit log"
        description="Every significant action, newest first. Admin-only — it records what editors and reviewers did, not just authors."
      />

      <Card className="mt-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Select
            label="Entity type"
            value={entityType}
            onChange={(e) => resetTo(() => setEntityType(e.target.value))}
            placeholder="All"
            options={[
              { value: 'article', label: 'Article' },
              { value: 'user', label: 'User' },
            ]}
          />
          <Select
            label="Action"
            value={action}
            onChange={(e) => resetTo(() => setAction(e.target.value))}
            placeholder="All"
            options={ACTIONS.map((a) => ({ value: a, label: a }))}
          />
          <Select
            label="Actor"
            value={actor}
            onChange={(e) => resetTo(() => setActor(e.target.value))}
            placeholder="Anyone"
            options={(usersQuery.data ?? []).map((u) => ({
              value: u.id_user,
              label: u.deleted_at ? `${u.user_name} (archived)` : u.user_name,
            }))}
          />
          <Input
            label="Entity ID"
            value={entityId}
            onChange={(e) => resetTo(() => setEntityId(e.target.value))}
            placeholder="Paste an article or user id"
          />
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
            message={errorMessage(query.error, 'Could not load the audit log.')}
            onRetry={() => query.refetch()}
          />
        )}

        {!query.isLoading && !query.isError && rows.length === 0 && (
          <EmptyState
            title="No entries"
            description={
              entityType || action || entityId || actor
                ? 'No actions match these filters.'
                : 'Nothing has been recorded yet. Actions appear here as soon as they happen.'
            }
          />
        )}

        {!query.isLoading && !query.isError && rows.length > 0 && (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>When</TH>
                  <TH>Actor</TH>
                  <TH>Action</TH>
                  <TH>Entity</TH>
                  <TH>Detail</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <TR key={row.id_audit}>
                    <TD className="whitespace-nowrap">{formatWhen(row.created_at)}</TD>
                    <TD className="font-medium text-ink-900">{actorName(row.id_actor)}</TD>
                    <TD>
                      <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-plum-700">
                        {row.action}
                      </code>
                    </TD>
                    <TD>
                      <span className="text-ink-600">{row.entity_type}</span>
                      {row.entity_id && (
                        <span className="ml-1 text-xs text-ink-400">{row.entity_id.slice(0, 8)}</span>
                      )}
                    </TD>
                    <TD className="text-xs text-ink-600">{formatDetail(row.detail)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            <div className="mt-4">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                count={rows.length}
                hasNext={hasNext}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
