/** The landing page's editable copy, grouped the way the page reads.
 *
 *  The backend stores site content as free-form key/value rows and will accept
 *  any key, so this list — not a database constraint — is what defines the set
 *  of fields an organiser can edit. Adding a line of copy to the landing page
 *  means adding its key here.
 */

export type FieldKind = 'text' | 'textarea'

export interface ContentField {
  key: string
  label: string
  kind: FieldKind
  hint?: string
}

export interface ContentSection {
  id: string
  label: string
  description: string
  fields: ContentField[]
}

export const CONTENT_SECTIONS: ContentSection[] = [
  {
    id: 'hero',
    label: 'Hero',
    description: 'The first screen visitors see, plus its background image.',
    fields: [
      { key: 'hero_title', label: 'Conference title', kind: 'textarea' },
      { key: 'hero_tagline', label: 'Tagline', kind: 'textarea' },
      { key: 'hero_date', label: 'Date', kind: 'text', hint: 'Shown as typed, e.g. "12–14 May 2026".' },
      { key: 'hero_location', label: 'Location', kind: 'text' },
      { key: 'hero_cta_label', label: 'Button label', kind: 'text', hint: 'Defaults to "Explore Event" when empty.' },
    ],
  },
  {
    id: 'about',
    label: 'About',
    description: 'What SIMIT is, alongside the photo gallery.',
    fields: [
      { key: 'about_heading', label: 'Heading', kind: 'text' },
      {
        key: 'about_body',
        label: 'Body',
        kind: 'textarea',
        hint: 'Leave a blank line between paragraphs.',
      },
    ],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    description: 'The section heading and the timeline entries beneath it.',
    fields: [
      { key: 'schedule_heading', label: 'Heading', kind: 'text' },
      { key: 'schedule_subtitle', label: 'Subtitle', kind: 'text' },
    ],
  },
  {
    id: 'subtheme',
    label: 'Sub Theme',
    description: 'Heading only — the cards come from Topics, which authors also pick from.',
    fields: [
      { key: 'subtheme_heading', label: 'Heading', kind: 'text' },
      { key: 'subtheme_subtitle', label: 'Subtitle', kind: 'text' },
    ],
  },
  {
    id: 'venue',
    label: 'Venue',
    description: 'Where the symposium takes place. Empty rows are hidden on the page.',
    fields: [
      { key: 'venue_heading', label: 'Heading', kind: 'text' },
      { key: 'venue_body', label: 'Body', kind: 'textarea' },
      { key: 'venue_address', label: 'Address', kind: 'textarea' },
      { key: 'venue_main', label: 'Main venue', kind: 'text' },
      { key: 'venue_metro', label: 'Nearest metro', kind: 'text' },
      {
        key: 'venue_coordinates',
        label: 'Map location',
        kind: 'text',
        hint: 'Coordinates like 39.9334, 32.8597 — or paste the Google Maps link. Leave empty to hide the map.',
      },
    ],
  },
  {
    id: 'faq',
    label: 'FAQ',
    description: 'The section heading and the questions beneath it.',
    fields: [
      { key: 'faq_heading', label: 'Heading', kind: 'text' },
      { key: 'faq_subtitle', label: 'Subtitle', kind: 'text' },
    ],
  },
  {
    id: 'footer',
    label: 'Footer & contacts',
    description: 'Shown at the bottom of every page, not only the landing page.',
    fields: [
      { key: 'footer_tagline', label: 'Tagline', kind: 'textarea' },
      { key: 'footer_copyright', label: 'Copyright line', kind: 'text' },
      { key: 'contact_phone_1', label: 'Phone 1', kind: 'text' },
      { key: 'contact_phone_2', label: 'Phone 2', kind: 'text' },
      { key: 'contact_instagram', label: 'Instagram', kind: 'text', hint: 'Handle only, e.g. simit_ppi.' },
      { key: 'contact_email', label: 'Email', kind: 'text' },
      { key: 'contact_address', label: 'Address', kind: 'text' },
    ],
  },
]

/** Every key any section can edit, plus the ones edited outside a text form. */
export const HERO_IMAGE_KEY = 'hero_image_path'

/**
 * The keys whose value the editor actually changed.
 *
 * The save endpoint upserts whatever it is given, so sending the whole section
 * every time would rewrite rows nobody touched — noise in the audit trail and
 * a needless way to clobber a change someone else just made. Values are
 * trimmed: trailing whitespace is never a deliberate edit.
 */
export function changedValues(
  original: Record<string, string>,
  draft: Record<string, string>,
): Record<string, string> {
  const changed: Record<string, string> = {}
  for (const [key, value] of Object.entries(draft)) {
    const next = value.trim()
    if (next !== (original[key] ?? '').trim()) changed[key] = next
  }
  return changed
}

/** Pulls a section's current values out of the full content map. */
export function sectionValues(
  section: ContentSection,
  content: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(section.fields.map((f) => [f.key, content[f.key] ?? '']))
}
