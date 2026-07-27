import { useEffect, useState } from 'react'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { changedValues, sectionValues, type ContentSection } from '@/lib/contentFields'

/**
 * One section's copy, saved as a batch.
 *
 * The section is the unit of saving, matching the backend's single-transaction
 * PUT: a heading and its subtitle either both land or neither does, so the page
 * never shows half an edit.
 */
export function TextSectionForm({
  section,
  content,
  onSaved,
}: {
  section: ContentSection
  content: Record<string, string>
  onSaved: () => void
}) {
  const [draft, setDraft] = useState(() => sectionValues(section, content))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Re-seed when the server's copy changes (a refetch, or switching sections).
  // Without this the form would keep showing a stale draft after a save.
  useEffect(() => {
    setDraft(sectionValues(section, content))
  }, [section, content])

  // Confirmation is cleared by moving to another section, NOT by the refetch a
  // save triggers — that arrives milliseconds later and would wipe the
  // "Saved." badge before anyone could read it.
  useEffect(() => {
    setError(null)
    setSaved(false)
  }, [section])

  const changes = changedValues(sectionValues(section, content), draft)
  const dirty = Object.keys(changes).length > 0

  async function handleSave() {
    if (!dirty) return
    setBusy(true)
    setError(null)
    try {
      await api.saveContent(changes)
      setSaved(true)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this section.')
    } finally {
      setBusy(false)
    }
  }

  function set(key: string, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
    setSaved(false)
  }

  return (
    <Card>
      <p className="text-sm text-ink-600">{section.description}</p>

      <div className="mt-5 space-y-4">
        {section.fields.map((field) =>
          field.kind === 'textarea' ? (
            <Textarea
              key={field.key}
              label={field.label}
              hint={field.hint}
              rows={field.key === 'about_body' ? 8 : 3}
              value={draft[field.key] ?? ''}
              onChange={(e) => set(field.key, e.target.value)}
            />
          ) : (
            <Input
              key={field.key}
              label={field.label}
              hint={field.hint}
              value={draft[field.key] ?? ''}
              onChange={(e) => set(field.key, e.target.value)}
            />
          ),
        )}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={handleSave} loading={busy} disabled={!dirty}>
          Save section
        </Button>
        {dirty && !busy && (
          <span className="text-xs text-ink-600">
            {Object.keys(changes).length} unsaved{' '}
            {Object.keys(changes).length === 1 ? 'change' : 'changes'}
          </span>
        )}
        {saved && !dirty && <span className="text-xs font-medium text-emerald-600">Saved.</span>}
      </div>
    </Card>
  )
}
