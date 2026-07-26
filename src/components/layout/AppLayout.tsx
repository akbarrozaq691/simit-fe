import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'

export function AppLayout({ header }: { header?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
