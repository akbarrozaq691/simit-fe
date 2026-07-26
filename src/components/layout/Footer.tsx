import { Logo } from '@/components/Logo'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-ink-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8" />
          <div>
            <p className="text-sm font-semibold text-plum-600">SIMIT</p>
            <p className="text-xs text-ink-600">
              4th International Student Symposium in Türkiye
            </p>
          </div>
        </div>
        <p className="text-xs text-ink-600">© Pusat Studi PPI Türkiye</p>
      </div>
    </footer>
  )
}
