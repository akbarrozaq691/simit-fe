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
import { ReviewQueue } from '@/pages/reviewer/ReviewQueue'
import { ReviewDetail } from '@/pages/reviewer/ReviewDetail'
import { EditorialDashboard } from '@/pages/editorial/EditorialDashboard'
import { ArticleManage } from '@/pages/editorial/ArticleManage'
import { Journals } from '@/pages/editorial/Journals'
import { TimelineAdmin } from '@/pages/editorial/TimelineAdmin'

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
              <Route element={<RequireRole roles={['SC']} />}>
                <Route path="/review" element={<ReviewQueue />} />
                <Route path="/review/:id" element={<ReviewDetail />} />
              </Route>
              <Route element={<RequireRole roles={['EIC']} />}>
                <Route path="/editorial" element={<EditorialDashboard />} />
                <Route path="/editorial/journals" element={<Journals />} />
                <Route path="/editorial/timeline" element={<TimelineAdmin />} />
                <Route path="/editorial/:id" element={<ArticleManage />} />
              </Route>
              {/* Role-gated groups are added by Task 7 */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
