import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { statusLabel, statusTone } from '@/lib/status'
import type { ArticleStatus } from '@/api/types'

const ALL_STATUSES: ArticleStatus[] = [
  'submitted',
  'assigned_to_sc',
  'abstract_review_complete',
  'abstract_accepted',
  'rejected',
  'full_paper_submitted',
  'full_paper_review_complete',
  'revision_needed',
  'accepted',
  'under_review',
]

function authorCount(authors: string): number {
  return authors.split(',').map((a) => a.trim()).filter(Boolean).length
}

export function EditorialDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['articles'],
    queryFn: () => api.listArticles(),
  })

  // Client-side filter is intentional: the list endpoint has no server-side
  // filter, and the event caps at ~65 presenters, so this is honest rather
  // than a scaling risk.
  const filtered = useMemo(() => {
    if (!data) return []
    if (statusFilter === 'all') return data
    return data.filter((a) => a.status === statusFilter)
  }, [data, statusFilter])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <PageHeader
        title="Editorial dashboard"
        description="All submissions across the SIMIT review pipeline."
        actions={
          <div className="flex gap-2">
            <Link
              to="/editorial/journals"
              className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-plum-600 ring-1 ring-plum-100 hover:bg-plum-50"
            >
              Journals
            </Link>
            <Link
              to="/editorial/timeline"
              className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-plum-600 ring-1 ring-plum-100 hover:bg-plum-50"
            >
              Timeline
            </Link>
          </div>
        }
      />

      <div className="max-w-xs">
        <Select
          label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All statuses' },
            ...ALL_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })),
          ]}
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-plum-500" />
        </div>
      )}

      {isError && (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Could not load articles.'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          title="No articles match this filter"
          description="Try a different status, or check back once authors submit."
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <Table>
          <THead>
            <TR>
              <TH>Title</TH>
              <TH>Authors</TH>
              <TH>Status</TH>
              <TH>Reviewers</TH>
              <TH>Updated</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {filtered.map((article) => (
              <TR key={article.id_article}>
                <TD className="max-w-xs truncate font-medium text-ink-900" title={article.title}>
                  {article.title}
                </TD>
                <TD>{authorCount(article.authors)}</TD>
                <TD>
                  <Badge tone={statusTone(article.status)}>{statusLabel(article.status)}</Badge>
                </TD>
                <TD>{article.reviewers.length}</TD>
                <TD>{new Date(article.updated_at).toLocaleDateString()}</TD>
                <TD>
                  <Link to={`/editorial/${article.id_article}`} className="font-semibold text-brand-600 hover:underline">
                    Manage
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  )
}
