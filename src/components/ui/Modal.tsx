import { useEffect, useRef } from 'react'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape closes the dialog. onClose lives in a ref so this listener is
  // registered once per open rather than on every render: callers pass an inline
  // arrow, whose identity changes each time, and re-running this effect used to
  // drag the focus effect below along with it.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Move focus into the dialog when it opens — and ONLY then. This effect used
  // to depend on onClose as well, so every keystroke in a field re-ran it and
  // pulled the caret out of the input the user was typing in: one character per
  // click, which made every form in the admin screens unusable.
  useEffect(() => {
    if (!open) return
    // Prefer the first field, so the dialog can be typed into immediately.
    const firstField = panelRef.current?.querySelector<HTMLElement>(
      'input:not([type="hidden"]), textarea, select',
    )
    ;(firstField ?? panelRef.current)?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg ring-1 ring-ink-200 focus:outline-none"
      >
        {title && <h2 className="mb-4 text-lg font-bold text-plum-600">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
