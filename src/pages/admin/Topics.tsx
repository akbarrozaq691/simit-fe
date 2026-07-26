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
import type { SubTopic, Topic } from '@/api/types'

type Kind = 'stem' | 'humanity' | 'interdisciplinary'

const KINDS: { key: Kind; label: string }[] = [
  { key: 'stem', label: 'STEM' },
  { key: 'humanity', label: 'Humanities' },
  { key: 'interdisciplinary', label: 'Interdisciplinary' },
]

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

export function Topics() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['topics'], queryFn: api.listTopics })

  const [newTopic, setNewTopic] = useState('')
  const [topicError, setTopicError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [renaming, setRenaming] = useState<Topic | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)

  const [removing, setRemoving] = useState<Topic | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  /** Keyed by `${topicId}:${kind}` so each add box tracks its own draft. */
  const [subDrafts, setSubDrafts] = useState<Record<string, string>>({})
  const [subError, setSubError] = useState<string | null>(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['topics'] })
  }

  async function handleCreateTopic() {
    if (!newTopic.trim()) {
      setTopicError('Enter a topic name.')
      return
    }
    setBusy(true)
    setTopicError(null)
    try {
      await api.createTopic(newTopic.trim())
      setNewTopic('')
      invalidate()
    } catch (err) {
      setTopicError(errorMessage(err, 'Could not create the topic.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleRename() {
    if (!renaming) return
    setBusy(true)
    setRenameError(null)
    try {
      await api.updateTopic(renaming.id_topic, renameValue.trim())
      setRenaming(null)
      invalidate()
    } catch (err) {
      setRenameError(errorMessage(err, 'Could not rename the topic.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteTopic() {
    if (!removing) return
    setBusy(true)
    setRemoveError(null)
    try {
      await api.deleteTopic(removing.id_topic)
      setRemoving(null)
      invalidate()
    } catch (err) {
      setRemoveError(errorMessage(err, 'Could not delete the topic.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleAddSub(topicId: string, kind: Kind) {
    const key = `${topicId}:${kind}`
    const name = (subDrafts[key] ?? '').trim()
    if (!name) return
    setBusy(true)
    setSubError(null)
    try {
      await api.createSubTopic(kind, topicId, name)
      setSubDrafts((d) => ({ ...d, [key]: '' }))
      invalidate()
    } catch (err) {
      setSubError(errorMessage(err, 'Could not add the subtopic.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteSub(kind: Kind, sub: SubTopic) {
    setBusy(true)
    setSubError(null)
    try {
      await api.deleteSubTopic(kind, sub.id_sub_topic)
      invalidate()
    } catch (err) {
      setSubError(errorMessage(err, 'Could not delete the subtopic.'))
    } finally {
      setBusy(false)
    }
  }

  const topics = query.data ?? []

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader
        title="Topics"
        description="Topics and their subtopics are what authors choose from when submitting an abstract."
      />

      <Card className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="New topic"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g. Sains Alam"
              error={topicError ?? undefined}
            />
          </div>
          <Button onClick={handleCreateTopic} loading={busy}>
            Add topic
          </Button>
        </div>
      </Card>

      {subError && (
        <div className="mt-4">
          <ErrorState message={subError} />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {query.isLoading && (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-plum-500" />
          </div>
        )}

        {query.isError && (
          <ErrorState
            message={errorMessage(query.error, 'Could not load topics.')}
            onRetry={() => query.refetch()}
          />
        )}

        {!query.isLoading && !query.isError && topics.length === 0 && (
          <EmptyState
            title="No topics yet"
            description="Add a topic so authors have something to categorise their abstract under."
          />
        )}

        {topics.map((topic) => (
          <Card key={topic.id_topic}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-plum-600">{topic.topic_name}</h3>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setRenaming(topic)
                    setRenameValue(topic.topic_name)
                    setRenameError(null)
                  }}
                >
                  Rename
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setRemoving(topic)
                    setRemoveError(null)
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {KINDS.map(({ key, label }) => {
                const subs = topic[key]
                const draftKey = `${topic.id_topic}:${key}`
                return (
                  <div key={key} className="rounded-lg bg-ink-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-plum-500">{label}</p>
                    {subs.length === 0 ? (
                      <p className="mt-2 text-sm text-ink-400">None yet</p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {subs.map((sub) => (
                          <li key={sub.id_sub_topic} className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-ink-800">{sub.name}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSub(key, sub)}
                              className="text-xs font-medium text-rose-600 hover:underline"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex gap-2">
                      <input
                        value={subDrafts[draftKey] ?? ''}
                        onChange={(e) => setSubDrafts((d) => ({ ...d, [draftKey]: e.target.value }))}
                        placeholder="Add subtopic"
                        className="w-full rounded-lg border border-ink-200 bg-white px-2 py-1 text-sm"
                      />
                      <Button size="sm" variant="secondary" onClick={() => handleAddSub(topic.id_topic, key)}>
                        Add
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={renaming !== null} onClose={() => setRenaming(null)} title="Rename topic">
        <Input
          label="Name"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          error={renameError ?? undefined}
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRenaming(null)}>
            Cancel
          </Button>
          <Button onClick={handleRename} loading={busy}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal open={removing !== null} onClose={() => setRemoving(null)} title="Delete topic">
        <p className="text-sm text-ink-600">
          Delete <span className="font-semibold text-ink-900">{removing?.topic_name}</span> and all of its
          subtopics? Articles already assigned to it keep their reference.
        </p>
        {removeError && <p className="mt-3 text-sm font-medium text-rose-600">{removeError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteTopic} loading={busy}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
