import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/api/endpoints'
import { DownloadVersionButton } from '@/components/DownloadVersionButton'
import { ApiError } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { phaseOf, statusLabel, statusTone } from '@/lib/status'
import type { Review } from '@/api/types'
import type { Tone } from '@/lib/status'

const DECISION_TONE: Record<Review['decision'], Tone> = {
  accept: 'success',
  reject: 'danger',
  revision: 'action',
}

const DECISION_LABEL: Record<Review['decision'], string> = {
  accept: 'Accept',
  reject: 'Reject',
  revision: 'Revision requested',
}

export function ReviewDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [choice, setChoice] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
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
  const reviewsQuery = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.listReviews(id!),
    enabled: !!id,
  })

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
  const phase = phaseOf(article.status)
  const versions = versionsQuery.data ?? []
  const reviews = reviewsQuery.data ?? []

  // Latest version for the phase currently under review — the one a form
  // submission would attach to.
  const latestPhaseVersion = phase
    ? versions
        .filter((v) => v.phase === phase)
        .sort((a, b) => b.version_number - a.version_number)[0]
    : undefined

  const alreadyReviewed =
    !!latestPhaseVersion && reviews.some((r) => r.id_version === latestPhaseVersion.id_version)

  async function handleSubmit() {
    if (!choice) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      if (phase === 'abstract') {
        await api.reviewAbstract(article.id_article, choice === 'accept', notes || undefined)
      } else if (phase === 'full_paper') {
        await api.reviewFullPaper(
          article.id_article,
          choice as 'accept' | 'revision',
          notes || undefined,
        )
      }
      setChoice(null)
      setNotes('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['article', id] }),
        queryClient.invalidateQueries({ queryKey: ['reviews', id] }),
        queryClient.invalidateQueries({ queryKey: ['articles'] }),
      ])
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
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
          {article.sub_topic && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
                Sub theme
              </dt>
              <dd className="mt-0.5 text-sm text-ink-800">{article.sub_topic}</dd>
            </div>
          )}
        </dl>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Abstract</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-ink-800">{article.abstract}</dd>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Version history</h2>
        {versions.length === 0 ? (
          <p className="text-sm text-ink-600">No versions submitted yet.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Phase</TH>
                <TH>Version</TH>
                <TH>File</TH>
                <TH>Submitted</TH>
              </TR>
            </THead>
            <TBody>
              {versions.map((v) => (
                <TR key={v.id_version}>
                  <TD className="capitalize">{v.phase.replace('_', ' ')}</TD>
                  <TD>{v.version_number}</TD>
                  <TD>
                    <DownloadVersionButton idArticle={id!} idVersion={v.id_version} />
                  </TD>
                  <TD>{new Date(v.submitted_at).toLocaleDateString()}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink-800">Your review</h2>

        {phase === null && (
          <p className="text-sm text-ink-600">
            This article isn't awaiting your review right now.
          </p>
        )}

        {phase !== null && alreadyReviewed && (
          <p className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700 ring-1 ring-ink-200">
            You've already reviewed this version. Your decision will be visible below.
          </p>
        )}

        {phase !== null && !alreadyReviewed && (
          <>
            {submitError && <ErrorState message={submitError} />}
            <div className="flex flex-col gap-2">
              {(phase === 'abstract'
                ? [
                    { value: 'accept', label: 'Accept' },
                    { value: 'reject', label: 'Reject' },
                  ]
                : [
                    { value: 'accept', label: 'Accept' },
                    { value: 'revision', label: 'Request revision' },
                  ]
              ).map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-ink-800">
                  <input
                    type="radio"
                    name="decision"
                    value={opt.value}
                    checked={choice === opt.value}
                    onChange={() => setChoice(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <Textarea
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <Button onClick={handleSubmit} loading={submitting} disabled={!choice} className="self-start">
              Submit review
            </Button>
          </>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Your past reviews</h2>
        <p className="mb-3 text-xs text-ink-600">
          SIMIT uses blind review — this list shows only reviews you've submitted, not other
          reviewers' decisions.
        </p>
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-600">You haven't submitted a review for this article yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id_review} className="rounded-lg px-3 py-2 ring-1 ring-ink-200">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={DECISION_TONE[r.decision]}>{DECISION_LABEL[r.decision]}</Badge>
                  <span className="text-xs text-ink-600">
                    {new Date(r.reviewed_at).toLocaleDateString()}
                  </span>
                </div>
                {r.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-ink-800">{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
