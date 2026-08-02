import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { mapEmbedUrl } from '@/lib/venueMap'
import type { FaqItem, GalleryImage, Journal, LandingTopic, ScheduleItem } from '@/api/types'

/** Reads a CMS key, falling back to '' so a section renders empty rather than
 *  printing "undefined" when an admin hasn't filled it in yet. */
function text(content: Record<string, string>, key: string): string {
  return content[key] ?? ''
}

function Section({
  id,
  tinted = false,
  children,
}: {
  id?: string
  tinted?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={
        tinted
          ? 'bg-gradient-to-br from-brand-50 via-plum-50 to-brand-100/60 px-6 py-20'
          : 'bg-white px-6 py-20'
      }
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  if (!title && !subtitle) return null
  return (
    <div className="mb-12 text-center">
      {title && <h2 className="text-3xl font-bold text-plum-600">{title}</h2>}
      {subtitle && <p className="mt-2 text-sm text-ink-600">{subtitle}</p>}
    </div>
  )
}

function Hero({ content }: { content: Record<string, string> }) {
  const { isAuthenticated } = useAuth()
  const image = text(content, 'hero_image_path')

  return (
    <section id="home" className="relative overflow-hidden">
      {/* Falls back to a plum gradient when no hero image is set — storage may
          not be configured yet, and a broken <img> looks worse than a
          deliberate background. */}
      {image ? (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-plum-700/60" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-plum-600 via-plum-700 to-brand-700" />
      )}

      <div className="relative mx-auto max-w-4xl px-6 py-28 text-center">
        <h1 className="font-serif text-4xl leading-tight text-white sm:text-5xl">
          {text(content, 'hero_title')}
        </h1>
        {text(content, 'hero_tagline') && (
          <p className="mx-auto mt-5 max-w-2xl text-base text-brand-100">
            {text(content, 'hero_tagline')}
          </p>
        )}

        {(text(content, 'hero_location') || text(content, 'hero_date')) && (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-wide text-white ring-1 ring-white/25">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 6H4v8h12V8Z" />
            </svg>
            {[text(content, 'hero_location'), text(content, 'hero_date')]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        <div className="mt-9">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-flex items-center rounded-lg bg-plum-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-plum-600"
          >
            {text(content, 'hero_cta_label') || 'Explore Event'}
          </Link>
        </div>
      </div>
    </section>
  )
}

function About({
  content,
  gallery,
}: {
  content: Record<string, string>
  gallery: GalleryImage[]
}) {
  // The CMS stores paragraphs separated by blank lines, so admins edit plain
  // text rather than markup.
  const paragraphs = text(content, 'about_body')
    .split(/\n\s*\n/)
    .filter(Boolean)

  return (
    <Section id="about" tinted>
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {gallery.slice(0, 4).map((image, index) => (
                <img
                  key={image.id_image}
                  src={image.file_path}
                  alt={image.caption ?? ''}
                  className={`h-40 w-full rounded-lg object-cover shadow-sm ${
                    index % 3 === 0 ? 'md:translate-y-3' : ''
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-plum-300/60 bg-white/50 px-6 text-center text-sm text-ink-600">
              Photos will appear here once they are uploaded.
            </div>
          )}
        </div>

        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-plum-600">{text(content, 'about_heading')}</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-800">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

function Schedule({
  content,
  schedule,
}: {
  content: Record<string, string>
  schedule: ScheduleItem[]
}) {
  return (
    <Section id="schedule">
      <SectionHeading
        title={text(content, 'schedule_heading')}
        subtitle={text(content, 'schedule_subtitle')}
      />

      {schedule.length === 0 ? (
        <p className="text-center text-sm text-ink-600">The schedule will be published soon.</p>
      ) : (
        <ol className="relative mx-auto max-w-3xl space-y-4 border-l-2 border-brand-100 pl-8">
          {schedule.map((item) => (
            <li key={item.id_schedule} className="relative">
              <span className="absolute -left-[41px] top-6 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
              {/* The date used to be a third flex child on the same row. On a
                  phone it took 156 of 294px, and because the text column is
                  `flex-1 min-w-0` that column shrank to ~24px instead of
                  pushing the date onto its own line: the heading broke after
                  five letters and the description wrapped one word per line.
                  The date now sits inside the text column, beside the heading
                  when there is room and under it when there is not. */}
              <div className="flex items-start gap-4 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-plum-500 text-white">
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M5 2h7l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm2 6h6v1.5H7V8Zm0 4h6v1.5H7V12Z" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="font-semibold text-plum-600">{item.title}</h3>
                    {item.date_text && (
                      <span className="whitespace-nowrap rounded-md bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700">
                        {item.date_text}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{item.description}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Section>
  )
}

function SubThemes({
  content,
  topics,
}: {
  content: Record<string, string>
  topics: LandingTopic[]
}) {
  const { isAuthenticated } = useAuth()

  return (
    <Section id="sub-theme" tinted>
      <SectionHeading
        title={text(content, 'subtheme_heading')}
        subtitle={text(content, 'subtheme_subtitle')}
      />

      {topics.length === 0 ? (
        <p className="text-center text-sm text-ink-600">Sub themes will be announced soon.</p>
      ) : (
        <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <div
              key={topic.id_topic}
              className="flex h-full flex-col rounded-xl border border-brand-100 bg-white p-5 shadow-sm"
            >
              <h3 className="font-bold text-plum-600">{topic.topic_name}</h3>
              {topic.description && (
                <p className="mt-1.5 text-sm text-ink-600">{topic.description}</p>
              )}

              {/* The sub-themes are the point of this section — a track name
                  alone does not tell an author whether their paper fits. */}
              {topic.sub_topics.length > 0 && (
                <ol className="mt-4 flex-1 space-y-2">
                  {topic.sub_topics.map((name, index) => (
                    <li key={name} className="flex gap-2.5 text-sm leading-snug text-ink-800">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                        {index + 1}
                      </span>
                      <span>{name}</span>
                    </li>
                  ))}
                </ol>
              )}

              <Link
                to={isAuthenticated ? '/submit' : '/register'}
                className="mt-5 rounded-lg bg-plum-500 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-plum-600"
              >
                {isAuthenticated ? 'Submit Abstract' : 'Register Now'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

function Template({ content }: { content: Record<string, string> }) {
  const heading = text(content, 'template_heading')
  const description = text(content, 'template_description')
  const url = text(content, 'template_url')
  // Hidden entirely when unset: no button pointing nowhere.
  if (!heading && !description && !url) return null

  return (
    <Section id="template">
      <SectionHeading title={heading} />
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        {description && <p className="text-sm leading-relaxed text-ink-700">{description}</p>}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-lg bg-plum-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-plum-600"
          >
            Download Template
          </a>
        )}
      </div>
    </Section>
  )
}

function Output({
  content,
  journals,
}: {
  content: Record<string, string>
  journals: Journal[]
}) {
  const heading = text(content, 'output_heading')
  const note = text(content, 'output_note')
  // Hidden entirely when there is nothing to say: an "Output" heading over an
  // empty list reads as a broken page rather than a pending announcement.
  if (!heading && journals.length === 0) return null

  return (
    <Section id="output">
      <SectionHeading title={heading} subtitle={text(content, 'output_subtitle')} />

      {journals.length === 0 ? (
        <p className="text-center text-sm text-ink-600">
          The publication venues will be announced soon.
        </p>
      ) : (
        <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* The same list an editor picks from when accepting a paper, so the
              page cannot drift from what authors are actually recommended to. */}
          {journals.map((journal) => (
            <li
              key={journal.id_journal}
              className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-4 shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-plum-500 text-white">
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M4 3h9l3 3v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm2 5h8v1.5H6V8Zm0 3.5h8V13H6v-1.5Z" />
                </svg>
              </span>
              <span className="font-semibold text-plum-600">{journal.journal_name}</span>
            </li>
          ))}
        </ul>
      )}

      {note && (
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-ink-700">
          {note}
        </p>
      )}
    </Section>
  )
}

function Venue({ content }: { content: Record<string, string> }) {
  const rows = [
    { label: 'Address', value: text(content, 'venue_address') },
    { label: 'Main Venue', value: text(content, 'venue_main') },
    { label: 'Nearest Metro', value: text(content, 'venue_metro') },
  ].filter((row) => row.value)

  const body = text(content, 'venue_body')
  const heading = text(content, 'venue_heading')
  const mapUrl = mapEmbedUrl(text(content, 'venue_coordinates'))
  // Hide the section entirely rather than showing a lone heading over nothing.
  if (!heading && !body && rows.length === 0 && !mapUrl) return null

  return (
    <Section id="venue" tinted>
      {/* Details left, map right — reading the address and seeing where it is
          belong side by side. Stacks below md, where two columns would leave
          both too narrow to be useful. */}
      <div className="grid items-start gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold text-plum-600">{heading}</h2>
          {body && <p className="mt-3 text-sm leading-relaxed text-ink-700">{body}</p>}
          {rows.length > 0 && (
            <dl className="mt-8 space-y-4">
              {rows.map((row) => (
                <div key={row.label}>
                  <dt className="text-sm font-semibold text-plum-600">{row.label}</dt>
                  <dd className="text-sm text-ink-700">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {mapUrl && (
          <div className="overflow-hidden rounded-xl border border-plum-100 shadow-sm">
            <iframe
              src={mapUrl}
              title={heading ? `Map of ${heading}` : 'Venue map'}
              className="h-80 w-full border-0 md:h-96"
              // Defer the map until it is nearly in view: it is the heaviest
              // thing on the page and sits well below the fold.
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </Section>
  )
}

function Faq({ content, faq }: { content: Record<string, string>; faq: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <Section id="faq">
      <SectionHeading
        title={text(content, 'faq_heading')}
        subtitle={text(content, 'faq_subtitle')}
      />

      {faq.length === 0 ? (
        <p className="text-center text-sm text-ink-600">
          Questions and answers will be posted closer to the event.
        </p>
      ) : (
        <div className="mx-auto max-w-3xl divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200">
          {faq.map((item) => {
            const open = openId === item.id_faq
            return (
              <div key={item.id_faq}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id_faq)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 bg-white px-5 py-4 text-left text-sm font-semibold text-ink-900 hover:bg-ink-50"
                >
                  {item.question}
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-lg text-plum-500 transition ${open ? 'rotate-45' : ''}`}
                  >
                    +
                  </span>
                </button>
                {open && (
                  <p className="whitespace-pre-line bg-ink-50 px-5 pb-5 pt-1 text-sm text-ink-700">
                    {item.answer}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Section>
  )
}

export function Landing() {
  const landing = useQuery({ queryKey: ['landing'], queryFn: api.getLanding })

  if (landing.isLoading) {
    return (
      <div className="flex justify-center py-28">
        <Spinner className="h-7 w-7 text-plum-500" />
      </div>
    )
  }

  if (landing.isError || !landing.data) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24">
        <ErrorState
          title="Couldn't load the page"
          message={
            landing.error instanceof ApiError
              ? landing.error.message
              : 'The site content is unavailable right now.'
          }
          onRetry={() => landing.refetch()}
        />
      </div>
    )
  }

  const { content, schedule, faq, gallery, topics, journals } = landing.data

  return (
    <>
      <Hero content={content} />
      <About content={content} gallery={gallery} />
      <Schedule content={content} schedule={schedule} />
      <SubThemes content={content} topics={topics} />
      <Template content={content} />
      <Output content={content} journals={journals} />
      <Venue content={content} />
      <Faq content={content} faq={faq} />
    </>
  )
}
