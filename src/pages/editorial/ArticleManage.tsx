import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table'
import { assignErrorMessage, type AssignError } from '@/lib/coiError'
import { statusLabel, statusTone } from '@/lib/status'
import type { Tone } from '@/lib/status'
import type { Review } from '@/api/types'

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

export function ArticleManage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Assign-reviewers panel state
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
  const [overrideCoi, setOverrideCoi] = useState(false)
  const [assignError, setAssignError] = useState<AssignError | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [unassigningId, setUnassigningId] = useState<string | null>(null)
  const [unassignError, setUnassignError] = useState<string | null>(null)

  // Decision panel state
  const [decision, setDecision] = useState<string | null>(null)
  const [decisionJournal, setDecisionJournal] = useState('')
  const [decisionError, setDecisionError] = useState<string | null>(null)
  const [announcing, setAnnouncing] = useState(false)

  // Archive panel state (admin only)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archiveBusy, setArchiveBusy] = useState(false)

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
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => api.listUsers() })
  const journalsQuery = useQuery({ queryKey: ['journals'], queryFn: api.listJournals })

  const users = usersQuery.data ?? []
  const nameFor = useMemo(() => {
    const map = new Map(users.map((u) => [u.id_user, u.user_name]))
    return (userId: string) => map.get(userId) ?? userId
  }, [users])

  if (articleQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6 text-plum-500" />
      </div>
    )
  }

  if (articleQuery.isError || !articleQuery.data) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <ErrorState
          message={
            articleQuery.error instanceof ApiError ? articleQuery.error.message : "Couldn't load this submission."
          }
          onRetry={() => articleQuery.refetch()}
        />
      </div>
    )
  }

  const article = articleQuery.data
  const versions = versionsQuery.data ?? []
  const reviews = reviewsQuery.data ?? []

  const versionLabel = (idVersion: string) => {
    const v = versions.find((x) => x.id_version === idVersion)
    if (!v) return '—'
    return `${v.phase === 'abstract' ? 'Abstract' : 'Full paper'} v${v.version_number}`
  }

  const candidates = users.filter((u) => u.role === 'SC' && !article.reviewers.includes(u.id_user))

  async function invalidateAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['article', id] }),
      queryClient.invalidateQueries({ queryKey: ['reviews', id] }),
      queryClient.invalidateQueries({ queryKey: ['articles'] }),
    ])
  }

  async function handleArchive() {
    setArchiveError(null)
    setArchiveBusy(true)
    try {
      await api.deleteArticle(article.id_article)
      setConfirmArchive(false)
      await invalidateAll()
      // Leave this page rather than stay on it: the API hides an archived
      // article's versions and reviews (404), so remaining here would show a
      // half-broken screen. The archive list is where it lives now.
      navigate('/admin/archive')
    } catch (err) {
      setArchiveError(err instanceof ApiError ? err.message : 'Could not archive this submission.')
    } finally {
      setArchiveBusy(false)
    }
  }

  async function handleRestore() {
    setArchiveError(null)
    setArchiveBusy(true)
    try {
      await api.restoreArticle(article.id_article)
      await invalidateAll()
    } catch (err) {
      setArchiveError(err instanceof ApiError ? err.message : 'Could not restore this submission.')
    } finally {
      setArchiveBusy(false)
    }
  }

  async function handleAssign() {
    if (selectedReviewers.length === 0) return
    setAssignError(null)
    setAssigning(true)
    try {
      await api.assignReviewers(article.id_article, selectedReviewers, overrideCoi)
      setSelectedReviewers([])
      setOverrideCoi(false)
      await invalidateAll()
    } catch (err) {
      setAssignError(assignErrorMessage(err, nameFor))
    } finally {
      setAssigning(false)
    }
  }

  async function handleUnassign(reviewerId: string) {
    setUnassignError(null)
    setUnassigningId(reviewerId)
    try {
      await api.unassignReviewer(article.id_article, reviewerId)
      await invalidateAll()
    } catch (err) {
      setUnassignError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setUnassigningId(null)
    }
  }

  const decisionPhase =
    article.status === 'abstract_review_complete'
      ? 'abstract'
      : article.status === 'full_paper_review_complete'
        ? 'full_paper'
        : null

  async function handleAnnounce() {
    if (!decision) return
    if (decisionPhase === 'full_paper' && decision === 'accept' && !decisionJournal) {
      setDecisionError('A recommended journal is required to accept a full paper.')
      return
    }
    setDecisionError(null)
    setAnnouncing(true)
    try {
      if (decisionPhase === 'abstract') {
        await api.announceAbstract(article.id_article, decision as 'accept' | 'reject')
      } else if (decisionPhase === 'full_paper') {
        await api.announceFullPaper(
          article.id_article,
          decision as 'accept' | 'revision',
          decision === 'accept' ? decisionJournal : undefined,
        )
      }
      setDecision(null)
      setDecisionJournal('')
      await invalidateAll()
    } catch (err) {
      setDecisionError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setAnnouncing(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
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
        </dl>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Abstract</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-ink-800">{article.abstract}</dd>
        </div>
      </Card>

      {/* Reviewers panel */}
      <Card className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink-800">Reviewers</h2>

        {article.reviewers.length === 0 ? (
          <p className="text-sm text-ink-600">No reviewers assigned yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {unassignError && <ErrorState message={unassignError} />}
            {article.reviewers.map((reviewerId) => (
              <div
                key={reviewerId}
                className="flex items-center justify-between rounded-lg px-3 py-2 ring-1 ring-ink-200"
              >
                <span className="text-sm text-ink-800">{nameFor(reviewerId)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={unassigningId === reviewerId}
                  onClick={() => handleUnassign(reviewerId)}
                >
                  Unassign
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-lg bg-ink-50 p-4 ring-1 ring-ink-200">
          <h3 className="text-sm font-semibold text-ink-800">Assign reviewers</h3>
          {assignError && (
            <ErrorState title={assignError.title} message={assignError.message} />
          )}
          {candidates.length === 0 ? (
            <p className="text-sm text-ink-600">No eligible SC members left to assign.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {candidates.map((u) => (
                <label key={u.id_user} className="flex items-center gap-2 text-sm text-ink-800">
                  <input
                    type="checkbox"
                    checked={selectedReviewers.includes(u.id_user)}
                    onChange={(e) =>
                      setSelectedReviewers((prev) =>
                        e.target.checked ? [...prev, u.id_user] : prev.filter((x) => x !== u.id_user),
                      )
                    }
                  />
                  {u.user_name}
                  {u.institution_name && <span className="text-xs text-ink-500">({u.institution_name})</span>}
                </label>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-ink-800">
            <input type="checkbox" checked={overrideCoi} onChange={(e) => setOverrideCoi(e.target.checked)} />
            Override conflict of interest
          </label>
          <p className="text-xs text-ink-500">
            Assignment is rejected if a reviewer shares an institution with an author, unless overridden here.
          </p>
          <Button
            onClick={handleAssign}
            loading={assigning}
            disabled={selectedReviewers.length === 0}
            className="self-start"
          >
            Assign
          </Button>
        </div>
      </Card>

      {/* Reviews panel */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-600">No reviews submitted yet.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Reviewer</TH>
                <TH>Decision</TH>
                <TH>Version</TH>
                <TH>Notes</TH>
                <TH>Date</TH>
              </TR>
            </THead>
            <TBody>
              {reviews.map((r) => (
                <TR key={r.id_review}>
                  <TD>{nameFor(r.id_reviewer)}</TD>
                  <TD>
                    <Badge tone={DECISION_TONE[r.decision]}>{DECISION_LABEL[r.decision]}</Badge>
                  </TD>
                  <TD>{versionLabel(r.id_version)}</TD>
                  <TD className="max-w-xs whitespace-pre-wrap">{r.notes || '—'}</TD>
                  <TD>{new Date(r.reviewed_at).toLocaleDateString()}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {/* Decision panel */}
      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink-800">Decision</h2>

        {decisionPhase === null && (
          <p className="text-sm text-ink-600">
            Waiting for all assigned reviewers to submit before a decision can be announced.
          </p>
        )}

        {decisionPhase !== null && (
          <>
            {decisionError && <ErrorState message={decisionError} />}
            <div className="flex flex-col gap-2">
              {(decisionPhase === 'abstract'
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
                    checked={decision === opt.value}
                    onChange={() => setDecision(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {decisionPhase === 'full_paper' && decision === 'accept' && (
              <Select
                label="Recommended journal"
                value={decisionJournal}
                onChange={(e) => setDecisionJournal(e.target.value)}
                placeholder="Select a journal"
                options={(journalsQuery.data ?? []).map((j) => ({ value: j.id_journal, label: j.journal_name }))}
              />
            )}

            <Button
              onClick={handleAnnounce}
              loading={announcing}
              disabled={
                !decision || (decisionPhase === 'full_paper' && decision === 'accept' && !decisionJournal)
              }
              className="self-start"
            >
              Announce decision
            </Button>
          </>
        )}
      </Card>

      {user?.role === 'admin' && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-plum-600">Archive</h2>
          {archiveError && <ErrorState message={archiveError} />}
          {article.deleted_at ? (
            <>
              <p className="text-sm text-ink-600">
                This submission is archived. Restoring it returns it to the pipeline exactly where it
                left off — versions, reviews and reviewer assignments were all kept.
              </p>
              <Button
                variant="secondary"
                loading={archiveBusy}
                onClick={handleRestore}
                className="self-start"
              >
                Restore submission
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-600">
                Archiving hides the submission from the pipeline and blocks further review, but keeps
                its full history. It can be restored later.
              </p>
              <Button
                variant="danger"
                onClick={() => {
                  setArchiveError(null)
                  setConfirmArchive(true)
                }}
                className="self-start"
              >
                Archive submission
              </Button>
            </>
          )}
        </Card>
      )}

      <Modal open={confirmArchive} onClose={() => setConfirmArchive(false)} title="Archive submission">
        <p className="text-sm text-ink-600">
          Archive <span className="font-semibold text-ink-900">{article.title}</span>? It disappears
          from the editorial list and no further reviews or decisions are possible until it is
          restored. Nothing is deleted.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmArchive(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={archiveBusy} onClick={handleArchive}>
            Archive
          </Button>
        </div>
      </Modal>
    </div>
  )
}
