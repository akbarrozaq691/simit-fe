import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { Navbar } from '@/components/layout/Navbar'
import { AuthProvider } from '@/auth/AuthContext'
import { RequireRole } from '@/auth/RequireRole'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { NotFound } from '@/pages/NotFound'
import { Dashboard } from '@/pages/author/Dashboard'
import { SubmitAbstract } from '@/pages/author/SubmitAbstract'
import { ArticleDetail } from '@/pages/author/ArticleDetail'

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
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={<RequireRole roles={['author']} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/submit" element={<SubmitAbstract />} />
                <Route path="/articles/:id" element={<ArticleDetail />} />
              </Route>
              {/* Role-gated groups are added by Tasks 5-7 */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
