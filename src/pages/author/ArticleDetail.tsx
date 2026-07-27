import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/api/endpoints'
import { DownloadVersionButton } from '@/components/DownloadVersionButton'
import { ApiError } from '@/api/client'
import { ArticleStatusStepper } from '@/components/ArticleStatusStepper'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { FileInput } from '@/components/ui/FileInput'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { statusLabel, statusTone } from '@/lib/status'

export function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const articleQuery = useQuery({
    queryKey: ['article', id],
    queryFn: () => api.getArticle(id!),
    enabled: !!id,
  })
  const versionsQuery = useQuery({
    queryKey: ['versions', id],
    queryFn: () => api.listVersions(id!),
    enabled: !!id,
  })
  const topicsQuery = useQuery({ queryKey: ['topics'], queryFn: api.listTopics })

  if (articleQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6 text-plum-500" />
      </div>
    )
  }

  if (articleQuery.isError || !articleQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <ErrorState
          message={
            articleQuery.error instanceof ApiError
              ? articleQuery.error.message
              : "Couldn't load this submission."
          }
          onRetry={() => articleQuery.refetch()}
        />
      </div>
    )
  }

  const article = articleQuery.data
  const topic = topicsQuery.data?.find((t) => t.id_topic === article.id_topic)

  async function handleAction(kind: 'full_paper' | 'revision') {
    if (!file) {
      setFileError('A PDF file is required')
      return
    }
    setFileError(null)
    setActionError(null)
    setSubmitting(true)
    try {
      // Upload before submit, same reasoning as abstract creation — only a
      // successful upload should move the article to its next phase.
      const { file_path } = await api.uploadPdf(file)
      if (kind === 'full_paper') {
        await api.submitFullPaper(article.id_article, file_path)
      } else {
        await api.submitRevision(article.id_article, file_path)
      }
      setFile(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['article', id] }),
        queryClient.invalidateQueries({ queryKey: ['versions', id] }),
        queryClient.invalidateQueries({ queryKey: ['articles'] }),
      ])
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <PageHeader
        title={article.title}
        description={`Submitted ${new Date(article.created_at).toLocaleDateString()}`}
        actions={<Badge tone={statusTone(article.status)}>{statusLabel(article.status)}</Badge>}
      />

      <Card>
        <ArticleStatusStepper status={article.status} />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink-800">Details</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Authors</dt>
            <dd className="mt-0.5 text-sm text-ink-800">{article.authors}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Keywords</dt>
            <dd className="mt-0.5 text-sm text-ink-800">{article.keywords || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Topic</dt>
            <dd className="mt-0.5 text-sm text-ink-800">{topic?.topic_name ?? '—'}</dd>
          </div>
        </dl>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Abstract</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-ink-800">{article.abstract}</dd>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Version history</h2>
        {(versionsQuery.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-ink-600">No versions submitted yet.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Phase</TH>
                <TH>Version</TH>
                <TH>Submitted</TH>
                <TH>File</TH>
              </TR>
            </THead>
            <TBody>
              {versionsQuery.data!.map((v) => (
                <TR key={v.id_version}>
                  <TD className="capitalize">{v.phase.replace('_', ' ')}</TD>
                  <TD>{v.version_number}</TD>
                  <TD>{new Date(v.submitted_at).toLocaleDateString()}</TD>
                  <TD>
                    <DownloadVersionButton idArticle={id!} idVersion={v.id_version} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <div className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-700 ring-1 ring-ink-200">
        Reviewer comments aren't shown to authors — SIMIT uses blind review. You'll be notified of
        decisions by email.
      </div>

      {(article.status === 'abstract_accepted' || article.status === 'revision_needed') && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink-800">
            {article.status === 'abstract_accepted' ? 'Submit full paper' : 'Submit revision'}
          </h2>
          {actionError && <ErrorState message={actionError} />}
          <FileInput
            label="Full paper (PDF)"
            error={fileError ?? undefined}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setFileError(null)
            }}
          />
          <Button
            onClick={() => handleAction(article.status === 'abstract_accepted' ? 'full_paper' : 'revision')}
            loading={submitting}
            className="self-start"
          >
            {article.status === 'abstract_accepted' ? 'Submit full paper' : 'Submit revision'}
          </Button>
        </Card>
      )}
    </div>
  )
}
