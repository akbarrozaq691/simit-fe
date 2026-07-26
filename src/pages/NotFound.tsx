import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-4xl font-bold text-plum-600">404</h1>
      <p className="text-ink-600">This page doesn't exist, or has moved.</p>
      <Link
        to="/"
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Back to home
      </Link>
    </div>
  )
}
