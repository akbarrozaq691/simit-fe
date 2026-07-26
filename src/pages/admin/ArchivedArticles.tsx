import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { statusLabel, statusTone } from '@/lib/status'

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ArchivedArticles() {
  const queryClient = useQueryClient()
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['articles', 'archived'],
    queryFn: () => api.listArticles(true),
  })

  const archived = (query.data ?? []).filter((a) => a.deleted_at !== null)

  async function handleRestore(id: string) {
    setRestoringId(id)
    setRestoreError(null)
    try {
      await api.restoreArticle(id)
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    } catch (err) {
      setRestoreError(errorMessage(err, 'Could not restore the submission.'))
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader
        title="Archived submissions"
        description="Archiving keeps everything — versions, reviews and reviewer assignments all survive, so a restored submission returns exactly where it left off."
      />

      {restoreError && (
        <div className="mt-4">
          <ErrorState message={restoreError} />
        </div>
      )}

      <div className="mt-6">
        {query.isLoading && (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-plum-500" />
          </div>
        )}

        {query.isError && (
          <ErrorState
            message={errorMessage(query.error, 'Could not load archived submissions.')}
            onRetry={() => query.refetch()}
          />
        )}

        {!query.isLoading && !query.isError && archived.length === 0 && (
          <EmptyState
            title="No archived submissions"
            description="Anything an admin archives from the editorial view appears here."
          />
        )}

        {!query.isLoading && !query.isError && archived.length > 0 && (
          <Table>
            <THead>
              <TR>
                <TH>Title</TH>
                <TH>Authors</TH>
                <TH>Status when archived</TH>
                <TH>Archived</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {archived.map((a) => (
                <TR key={a.id_article}>
                  <TD className="font-medium text-ink-900">
                    <Link to={`/editorial/${a.id_article}`} className="hover:text-brand-600 hover:underline">
                      {a.title}
                    </Link>
                  </TD>
                  <TD>{a.authors}</TD>
                  <TD>
                    <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                  </TD>
                  <TD>{a.deleted_at ? formatDate(a.deleted_at) : '—'}</TD>
                  <TD>
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={restoringId === a.id_article}
                        onClick={() => handleRestore(a.id_article)}
                      >
                        Restore
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  )
}
