import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { Navbar } from '@/components/layout/Navbar'
import { AuthProvider } from '@/auth/AuthContext'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout header={<Navbar />} />}>
              <Route
                path="/"
                element={
                  <div className="mx-auto max-w-6xl px-6 py-16">
                    <h1 className="text-3xl font-bold text-plum-600">SIMIT</h1>
                    <p className="mt-2 text-ink-600">Scaffold running. Pages land in later tasks.</p>
                  </div>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
