import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { CONTENT_SECTIONS, HERO_IMAGE_KEY } from '@/lib/contentFields'
import { FaqEditor } from './content/FaqEditor'
import { GalleryEditor } from './content/GalleryEditor'
import { HeroImageEditor } from './content/HeroImageEditor'
import { ScheduleEditor } from './content/ScheduleEditor'
import { TextSectionForm } from './content/TextSectionForm'

/**
 * The landing page's content, editable section by section.
 *
 * Tabs mirror the order the sections appear on the public page, so finding the
 * form for something you can see is a matter of scrolling the page in your head
 * rather than learning this screen's own layout.
 */
export function SiteContent() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['landing'], queryFn: api.getLanding })
  const [activeId, setActiveId] = useState(CONTENT_SECTIONS[0].id)

  // The public page and the footer read the same query key, so invalidating
  // here refreshes what a visitor would see without a reload.
  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['landing'] })
  }

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7 text-plum-500" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <ErrorState
          title="Couldn't load the site content"
          message={
            query.error instanceof ApiError ? query.error.message : 'The content is unavailable.'
          }
          onRetry={() => query.refetch()}
        />
      </div>
    )
  }

  const { content, schedule, faq, gallery, topics } = query.data
  const section = CONTENT_SECTIONS.find((s) => s.id === activeId) ?? CONTENT_SECTIONS[0]

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader
        title="Site content"
        description="Everything on the public landing page, including the footer shown across the site."
        actions={
          <Link to="/">
            <Button variant="secondary" size="sm">
              View page
            </Button>
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {CONTENT_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(s.id)}
            aria-current={s.id === activeId}
            className={
              s.id === activeId
                ? 'rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700'
                : 'rounded-lg px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900'
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        <TextSectionForm section={section} content={content} onSaved={refresh} />

        {/* Each section's non-text parts sit under its own copy, so the whole
            section is edited in one place rather than split across screens. */}
        {section.id === 'hero' && (
          <HeroImageEditor path={content[HERO_IMAGE_KEY] ?? ''} onChanged={refresh} />
        )}
        {section.id === 'about' && <GalleryEditor images={gallery} onChanged={refresh} />}
        {section.id === 'schedule' && <ScheduleEditor items={schedule} onChanged={refresh} />}
        {section.id === 'faq' && <FaqEditor items={faq} onChanged={refresh} />}
        {section.id === 'subtheme' && (
          <Card>
            <h3 className="font-semibold text-plum-600">Sub theme cards</h3>
            <p className="mt-1 text-sm text-ink-600">
              The {topics.length} card{topics.length === 1 ? '' : 's'} on this section are the
              topics authors choose from when submitting, so they are edited there — one list,
              never two that disagree.
            </p>
            <Link to="/admin/topics" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">
                Edit topics
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
