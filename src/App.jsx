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
import ImportLeads from './pages/ImportLeads'
import AcceptInvite from './pages/AcceptInvite'

// roles: array of allowed roles, e.g. ['admin','co-admin']
// adminOnly kept for compat
function ProtectedLayout({ children, adminOnly = false, roles }) {
  const { user, profile, loading, role, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-text-muted">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  if (roles && !roles.includes(role)) return <Navigate to="/dashboard" replace />

  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/accept-invite" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-leads" element={<MyLeads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route
              path="/leads"
              element={
                <ProtectedLayout roles={['admin', 'co-admin', 'viewer']}>
                  <AllLeads />
                </ProtectedLayout>
              }
            />
            <Route
              path="/import-leads"
              element={
                <ProtectedLayout roles={['admin', 'co-admin']}>
                  <ImportLeads />
                </ProtectedLayout>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedLayout roles={['admin', 'co-admin']}>
                  <UserManagement />
                </ProtectedLayout>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
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
            success: { iconTheme: { primary: '#10b981', secondary: '#1a1d27' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#1a1d27' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
