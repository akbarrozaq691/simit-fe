import { useEffect, useState } from 'react'

/** Roughly one screen down — far enough that scrolling back is a real chore. */
const SHOW_AFTER_PX = 500

/**
 * A fixed button that returns to the top of the page.
 *
 * The scroll listener is passive and only flips a boolean, so it cannot delay a
 * frame: an active listener on scroll is one of the easier ways to make a page
 * feel like it stutters.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleClick() {
    // Honour the OS setting: for someone who asked for less motion, a long
    // smooth scroll is the thing they turned off.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      // Kept in the DOM and faded out, rather than unmounted, so it does not
      // pop in mid-scroll. aria-hidden and inert while invisible, so it is not
      // reachable by keyboard or screen reader when it isn't there to see.
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-plum-500 text-white shadow-lg transition duration-200 hover:bg-plum-600 ${
        visible ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
        <path
          d="M10 16V5m0 0 4.5 4.5M10 5 5.5 9.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
