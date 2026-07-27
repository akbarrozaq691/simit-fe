import { useState } from 'react'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import type { FaqItem } from '@/api/types'

type Draft = { question: string; answer: string; sort_order: string }

const BLANK: Draft = { question: '', answer: '', sort_order: '0' }

export function FaqEditor({ items, onChanged }: { items: FaqItem[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<FaqItem | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(BLANK)
  const [removing, setRemoving] = useState<FaqItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!editing) return
    if (!draft.question.trim() || !draft.answer.trim()) {
      setError('Both a question and an answer are required.')
      return
    }
    const body = {
      question: draft.question.trim(),
      answer: draft.answer.trim(),
      sort_order: Number(draft.sort_order) || 0,
    }
    setBusy(true)
    setError(null)
    try {
      if (editing === 'new') await api.createFaq(body)
      else await api.updateFaq(editing.id_faq, body)
      setEditing(null)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the question.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!removing) return
    setBusy(true)
    setError(null)
    try {
      await api.deleteFaq(removing.id_faq)
      setRemoving(null)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the question.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-plum-600">Questions</h3>
          <p className="text-sm text-ink-600">
            Answers keep their line breaks on the page, so a list reads as a list.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing('new')
            setDraft(BLANK)
            setError(null)
          }}
        >
          Add question
        </Button>
      </div>

      {error && !editing && !removing && (
        <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>
      )}

      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No questions yet"
            description="Add the questions organisers get asked most, so nobody has to email to find out."
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <li
              key={item.id_faq}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-ink-200 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">
                  <span className="mr-2 text-xs text-ink-400">#{item.sort_order}</span>
                  {item.question}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-600">{item.answer}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(item)
                    setDraft({
                      question: item.question,
                      answer: item.answer,
                      sort_order: String(item.sort_order),
                    })
                    setError(null)
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setRemoving(item)
                    setError(null)
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add question' : 'Edit question'}
      >
        <div className="space-y-4">
          <Input
            label="Question"
            value={draft.question}
            onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
          />
          <Textarea
            label="Answer"
            rows={5}
            value={draft.answer}
            onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))}
          />
          <Input
            label="Sort order"
            type="number"
            value={draft.sort_order}
            onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
          />
        </div>
        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={busy}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal open={removing !== null} onClose={() => setRemoving(null)} title="Delete question">
        <p className="text-sm text-ink-600">
          Delete <span className="font-semibold text-ink-900">{removing?.question}</span>?
        </p>
        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={busy}>
            Delete
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
