import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MyLeads from './pages/MyLeads'
import LeadDetail from './pages/LeadDetail'
import AllLeads from './pages/AllLeads'
import UserManagement from './pages/UserManagement'

function ProtectedLayout({ children, adminOnly = false }) {
  const { user, profile, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/my-leads" replace />

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, profile, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user && profile ? <Navigate to={isAdmin ? '/dashboard' : '/my-leads'} replace /> : <Login />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedLayout adminOnly>
            <Dashboard />
          </ProtectedLayout>
        }
      />

      <Route
        path="/my-leads"
        element={
          <ProtectedLayout>
            <MyLeads />
          </ProtectedLayout>
        }
      />

      <Route
        path="/leads/:id"
        element={
          <ProtectedLayout>
            <LeadDetail />
          </ProtectedLayout>
        }
      />

      <Route
        path="/leads"
        element={
          <ProtectedLayout adminOnly>
            <AllLeads />
          </ProtectedLayout>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedLayout adminOnly>
            <UserManagement />
          </ProtectedLayout>
        }
      />

      <Route
        path="*"
        element={
          user && profile
            ? <Navigate to={isAdmin ? '/dashboard' : '/my-leads'} replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1d27',
              color: '#f1f5f9',
              border: '1px solid #2a2d3e',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1a1d27' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1a1d27' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
