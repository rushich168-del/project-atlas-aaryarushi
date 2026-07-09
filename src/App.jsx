import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'
import AdminInquiriesPage from './pages/AdminInquiriesPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ModulePlaceholderPage from './pages/ModulePlaceholderPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import ProductWorkspacePage from './pages/ProductWorkspacePage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import { getCurrentPath } from './utils/routes.js'

function AuthRedirect({ to }) {
  useEffect(() => {
    window.history.replaceState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [to])

  return (
    <main className="flex min-h-screen items-center justify-center bg-lightBg font-sans text-slateText">
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <Loader2 size={20} className="animate-spin text-accentBlue" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-600">Redirecting</span>
      </div>
    </main>
  )
}

function App() {
  const [path, setPath] = useState(getCurrentPath())
  const { loading, session } = useAuth()

  useEffect(() => {
    const handleRouteChange = () => setPath(getCurrentPath())

    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  if ((path === '/login' || path === '/signup') && loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-lightBg font-sans text-slateText">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Loader2 size={20} className="animate-spin text-accentBlue" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-600">Checking session</span>
        </div>
      </main>
    )
  }

  if ((path === '/login' || path === '/signup') && session) {
    return <AuthRedirect to="/dashboard" />
  }

  if (path === '/login') {
    return <LoginPage />
  }

  if (path === '/signup') {
    return <SignupPage />
  }

  if (path.startsWith('/dashboard/products/') && path.endsWith('/workspace')) {
    const slug = path.replace('/dashboard/products/', '').replace('/workspace', '')
    return (
      <ProtectedRoute>
        <ProductWorkspacePage slug={slug} />
      </ProtectedRoute>
    )
  }

  if (path.startsWith('/dashboard/products/')) {
    return (
      <ProtectedRoute>
        <ProductDetailPage slug={path.replace('/dashboard/products/', '')} />
      </ProtectedRoute>
    )
  }

  if (path === '/dashboard/products') {
    return (
      <ProtectedRoute>
        <ProductsPage />
      </ProtectedRoute>
    )
  }

  if (path === '/dashboard/history') {
    return (
      <ProtectedRoute>
        <HistoryPage />
      </ProtectedRoute>
    )
  }

  if (path === '/dashboard/admin/inquiries') {
    return (
      <ProtectedRoute>
        <AdminInquiriesPage />
      </ProtectedRoute>
    )
  }

  if (path.startsWith('/dashboard/')) {
    const moduleId = path.replace('/dashboard/', '')
    return (
      <ProtectedRoute>
        <ModulePlaceholderPage moduleId={moduleId} />
      </ProtectedRoute>
    )
  }

  if (path === '/dashboard') {
    return (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  }

  return <LandingPage />
}

export default App
