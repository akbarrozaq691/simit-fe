import { Outlet } from 'react-router-dom'
import { BackToTop } from './BackToTop'
import { Footer } from './Footer'
import { ScrollToHash } from './ScrollToHash'

export function AppLayout({ header }: { header?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToHash />
      {header}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}
