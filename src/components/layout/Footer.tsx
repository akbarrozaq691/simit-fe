import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/api/endpoints'
import { Logo } from '@/components/Logo'

const SECTION_LINKS = [
  { to: '/#about', label: 'About' },
  { to: '/#schedule', label: 'Schedule' },
  { to: '/#sub-theme', label: 'Sub Theme' },
  { to: '/#venue', label: 'Venue' },
  { to: '/#faq', label: 'FAQ' },
]

const ICONS = {
  phone: (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.6a1.5 1.5 0 0 1 1.46 1.15l.6 2.4a1.5 1.5 0 0 1-.72 1.66l-.9.52a10 10 0 0 0 4.83 4.83l.52-.9a1.5 1.5 0 0 1 1.66-.72l2.4.6A1.5 1.5 0 0 1 18 13.9v1.6A1.5 1.5 0 0 1 16.5 17h-.3A14.2 14.2 0 0 1 2 3.8V3.5Z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M6 2h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Zm4 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0 1.8a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4ZM15 4.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h13A1.5 1.5 0 0 1 18 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 14.5v-9Zm2.2.5 5.8 4 5.8-4H4.2Z" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M10 2a6 6 0 0 1 6 6c0 4.2-6 10-6 10S4 12.2 4 8a6 6 0 0 1 6-6Zm0 3.8A2.2 2.2 0 1 0 10 10a2.2 2.2 0 0 0 0-4.2Z" />
    </svg>
  ),
}

function ContactRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-xs text-ink-700">
      <span className="mt-0.5 shrink-0 text-plum-500">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </li>
  )
}

export function Footer() {
  // Same query key as the landing page, so on that page this is served from
  // cache. Failure is silent on purpose: a footer that cannot load its contact
  // details should degrade quietly, not put an error banner under every page.
  const { data } = useQuery({ queryKey: ['landing'], queryFn: api.getLanding, retry: false })
  const content = data?.content ?? {}

  const phones = [content.contact_phone_1, content.contact_phone_2].filter(Boolean)
  const hasContact =
    phones.length > 0 ||
    Boolean(content.contact_instagram) ||
    Boolean(content.contact_email) ||
    Boolean(content.contact_address)

  return (
    <footer className="mt-auto bg-gradient-to-br from-brand-50 via-plum-50 to-brand-100/60">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <Logo className="h-9 w-9" />
              <span className="text-lg font-bold tracking-tight text-plum-600">SIMIT</span>
            </div>
            {content.footer_tagline && (
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-ink-700">
                {content.footer_tagline}
              </p>
            )}
          </div>

          <nav aria-label="Sections">
            <ul className="space-y-1.5">
              <li>
                <Link to="/" className="text-xs text-ink-700 hover:text-plum-600">
                  Home
                </Link>
              </li>
              {SECTION_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs text-ink-700 hover:text-plum-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {hasContact && (
            <div>
              <p className="mb-2 text-xs font-semibold text-plum-600">Contact Us</p>
              <ul className="space-y-1.5">
                {phones.map((phone) => (
                  <ContactRow key={phone} icon={ICONS.phone}>
                    {phone}
                  </ContactRow>
                ))}
                {content.contact_instagram && (
                  <ContactRow icon={ICONS.instagram}>
                    <a
                      href={`https://instagram.com/${content.contact_instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:text-plum-600"
                    >
                      {content.contact_instagram}
                    </a>
                  </ContactRow>
                )}
                {content.contact_email && (
                  <ContactRow icon={ICONS.email}>
                    <a href={`mailto:${content.contact_email}`} className="hover:text-plum-600">
                      {content.contact_email}
                    </a>
                  </ContactRow>
                )}
                {content.contact_address && (
                  <ContactRow icon={ICONS.pin}>{content.contact_address}</ContactRow>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-10 border-t border-plum-100 pt-5">
          <p className="text-xs text-ink-600">
            {content.footer_copyright || '© Pusat Studi PPI Türkiye'}
          </p>
        </div>
      </div>
    </footer>
  )
}
