import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { phaseOf, statusLabel, statusTone } from '@/lib/status'
import type { Article } from '@/api/types'

function ArticleRow({ article }: { article: Article }) {
  return (
    <Link to={`/review/${article.id_article}`}>
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
      </Card>
    </Link>
  )
}

export function ReviewQueue() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['articles'],
    queryFn: () => api.listArticles(),
  })

  const awaiting = data?.filter((a) => phaseOf(a.status) !== null) ?? []
  const other = data?.filter((a) => phaseOf(a.status) === null) ?? []

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <PageHeader
        title="Review queue"
        description="Articles assigned to you as a Scientific Committee reviewer."
      />

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-plum-500" />
        </div>
      )}

      {isError && (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Could not load your assigned articles.'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <EmptyState
          title="No articles assigned to you yet"
          description="Check back once the Editor-in-Chief assigns you a submission to review."
        />
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <>
          {awaiting.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-ink-800">Awaiting your review</h2>
              {awaiting.map((article) => (
                <ArticleRow key={article.id_article} article={article} />
              ))}
            </div>
          )}

          {other.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-ink-800">Reviewed / in progress</h2>
              {other.map((article) => (
                <ArticleRow key={article.id_article} article={article} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
