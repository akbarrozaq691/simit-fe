import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { statusLabel, statusTone } from '@/lib/status'
import type { ArticleStatus } from '@/api/types'

function nextActionHint(status: ArticleStatus): { text: string; brand?: boolean } {
  switch (status) {
    case 'revision_needed':
      return { text: 'Revision required — open to resubmit', brand: true }
    case 'abstract_accepted':
      return { text: 'Submit your full paper' }
    case 'accepted':
      return { text: 'Accepted for publication' }
    case 'rejected':
      return { text: 'Not accepted' }
    default:
      return { text: 'Awaiting review' }
  }
}

export function Dashboard() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['articles'],
    queryFn: () => api.listArticles(),
  })

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <PageHeader
        title="My submissions"
        description="Track your abstracts and papers through the SIMIT review pipeline."
        actions={<Button onClick={() => navigate('/submit')}>Submit abstract</Button>}
      />

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-plum-500" />
        </div>
      )}

      {isError && (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Could not load your submissions.'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <EmptyState
          title="No submissions yet"
          description="Submit your first abstract to get started."
          action={<Button onClick={() => navigate('/submit')}>Submit your abstract</Button>}
        />
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3">
          {data!.map((article) => {
            const hint = nextActionHint(article.status)
            return (
              <Link key={article.id_article} to={`/articles/${article.id_article}`}>
                <Card className="transition hover:ring-plum-200">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink-900">{article.title}</p>
                      <p className="mt-0.5 text-xs text-ink-600">
                        Submitted {new Date(article.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge tone={statusTone(article.status)}>{statusLabel(article.status)}</Badge>
                  </div>
                  <p className={`mt-2 text-sm font-medium ${hint.brand ? 'text-brand-700' : 'text-ink-600'}`}>
                    {hint.text}
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
