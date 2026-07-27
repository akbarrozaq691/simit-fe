import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to the element named in the URL hash.
 *
 * React Router does not do this itself — it renders the route and leaves the
 * viewport where it was, so the landing page's "About"/"Schedule"/… nav links
 * would appear to do nothing. Runs after paint so the target exists even when
 * arriving at the page fresh rather than from another route.
 */
export function ScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 })
      return
    }
    const id = hash.slice(1)
    // rAF rather than a timeout: the section may still be mounting on a cold
    // load, and this runs on the first frame where it can exist.
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}
