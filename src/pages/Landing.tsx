import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/api/endpoints'
import type { SubTopic } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Logo } from '@/components/Logo'
import { Spinner } from '@/components/ui/Spinner'

const SUBTOPIC_GROUPS: { key: 'stem' | 'humanity' | 'interdisciplinary'; label: string }[] = [
  { key: 'stem', label: 'STEM' },
  { key: 'humanity', label: 'Humanities' },
  { key: 'interdisciplinary', label: 'Interdisciplinary' },
]

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  const startLabel = fmt(start)
  const endLabel = fmt(end)
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`
}

export function Landing() {
  const { isAuthenticated, user } = useAuth()
  const abstractCta = isAuthenticated && user?.role === 'author' ? '/submit' : '/register'

  const timeline = useQuery({ queryKey: ['timeline'], queryFn: api.listTimeline })
  const topics = useQuery({ queryKey: ['topics'], queryFn: api.listTopics })
  const journals = useQuery({ queryKey: ['journals'], queryFn: api.listJournals })

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-plum-600 to-plum-700 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center">
          <Logo className="h-14 w-14" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-plum-100">SIMIT</span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            4th International Student Symposium in Türkiye
          </h1>
          <p className="max-w-2xl text-plum-100">
            Present your research to an international audience of students and reviewers. Submit an abstract,
            pass peer review, and publish your full paper with one of our partner journals.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={abstractCta}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Submit your abstract
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/20"
            >
              Sign in
            </Link>
          </div>
          <p className="pt-4 text-xs font-medium uppercase tracking-wide text-plum-100">
            Target: 65 presenters
          </p>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-plum-600">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Card>
            <p className="text-sm font-semibold text-brand-600">Step 1</p>
            <h3 className="mt-1 text-lg font-bold text-ink-900">Submit your abstract</h3>
            <p className="mt-2 text-sm text-ink-600">
              Register as an author and submit your abstract, choosing the topic that fits your research.
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-brand-600">Step 2</p>
            <h3 className="mt-1 text-lg font-bold text-ink-900">Peer review</h3>
            <p className="mt-2 text-sm text-ink-600">
              Reviewers assess your abstract, then your full paper, giving feedback along the way.
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-brand-600">Step 3</p>
            <h3 className="mt-1 text-lg font-bold text-ink-900">Publication</h3>
            <p className="mt-2 text-sm text-ink-600">
              Accepted full papers are recommended for publication in one of our partner journals.
            </p>
          </Card>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-2xl font-bold text-plum-600">Timeline</h2>
          <div className="mt-8">
            {timeline.isLoading && (
              <div className="flex justify-center py-8 text-ink-600">
                <Spinner className="h-6 w-6" />
              </div>
            )}
            {timeline.isError && (
              <ErrorState message="Couldn't load the timeline." onRetry={() => timeline.refetch()} />
            )}
            {timeline.isSuccess && timeline.data.length === 0 && (
              <EmptyState title="No dates yet" description="The schedule will be published soon." />
            )}
            {timeline.isSuccess && timeline.data.length > 0 && (
              <ol className="relative border-l-2 border-plum-100 pl-6">
                {timeline.data.map((item) => (
                  <li key={item.id_timeline} className="mb-8 last:mb-0">
                    <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-brand-500" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                      {formatDateRange(item.start_date, item.end_date)}
                    </p>
                    <h3 className="mt-1 font-bold text-ink-900">{item.title}</h3>
                    {item.description && <p className="mt-1 text-sm text-ink-600">{item.description}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-plum-600">Topics</h2>
        <div className="mt-8">
          {topics.isLoading && (
            <div className="flex justify-center py-8 text-ink-600">
              <Spinner className="h-6 w-6" />
            </div>
          )}
          {topics.isError && <ErrorState message="Couldn't load topics." onRetry={() => topics.refetch()} />}
          {topics.isSuccess && topics.data.length === 0 && (
            <EmptyState title="No topics yet" description="Topics will be announced soon." />
          )}
          {topics.isSuccess && topics.data.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topics.data.map((topic) => {
                const groups = SUBTOPIC_GROUPS.map((g) => ({ ...g, items: topic[g.key] as SubTopic[] })).filter(
                  (g) => g.items.length > 0,
                )
                return (
                  <Card key={topic.id_topic}>
                    <h3 className="font-bold text-ink-900">{topic.topic_name}</h3>
                    {groups.length === 0 ? (
                      <p className="mt-2 text-sm text-ink-600">No subtopics yet.</p>
                    ) : (
                      <div className="mt-3 flex flex-col gap-2">
                        {groups.map((g) => (
                          <div key={g.key}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-plum-600">{g.label}</p>
                            <p className="mt-0.5 text-sm text-ink-600">{g.items.map((s) => s.name).join(', ')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Journals */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-plum-600">Output journals</h2>
          <p className="mt-2 text-sm text-ink-600">Accepted full papers are recommended for publication in:</p>
          <div className="mt-6">
            {journals.isLoading && (
              <div className="flex justify-center py-4 text-ink-600">
                <Spinner className="h-6 w-6" />
              </div>
            )}
            {journals.isError && (
              <ErrorState message="Couldn't load journals." onRetry={() => journals.refetch()} />
            )}
            {journals.isSuccess && journals.data.length === 0 && (
              <EmptyState title="No journals listed yet" />
            )}
            {journals.isSuccess && journals.data.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {journals.data.map((journal) => (
                  <span
                    key={journal.id_journal}
                    className="rounded-full bg-plum-50 px-4 py-1.5 text-sm font-semibold text-plum-700 ring-1 ring-plum-100"
                  >
                    {journal.journal_name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-plum-600">Ready to present at SIMIT?</h2>
        <p className="mt-2 text-sm text-ink-600">Registration is open — submit your abstract to get started.</p>
        <Link
          to={abstractCta}
          className="mt-6 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Submit your abstract
        </Link>
      </section>
    </div>
  )
}
