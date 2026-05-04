import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  RiDashboardLine, RiUserLine, RiGroupLine, RiFileList3Line,
  RiLogoutBoxLine, RiMenuFoldLine, RiMenuUnfoldLine, RiUploadLine,
  RiTeamLine,
} from 'react-icons/ri'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const LOGO_URL = 'https://www.libertybusinesspr.com/app/uploads/2026/01/logo-lb-rgb-sin-slogan-1.svg'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { profile, isAdmin, isCoAdmin, isVendedor, isViewer, canImport, canInvite, signOut } = useAuth()
  const navigate = useNavigate()

  const roleLabel = {
    admin:     'Administrador',
    'co-admin': 'Co-Admin',
    viewer:    'Viewer',
    vendedor:  'Vendedor',
    agent:     'Vendedor',
  }[profile?.role] ?? profile?.role ?? ''

  async function handleSignOut() {
    await signOut()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  const navBase = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150'
  const navActive = 'bg-accent-blue/20 text-accent-blue'
  const navIdle   = 'text-text-muted hover:bg-white/5 hover:text-text-base'

  return (
    <aside
      className={`flex flex-col h-screen bg-sidebar border-r border-border-subtle transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      } flex-shrink-0`}
    >
      {/* ── Logo header ─────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-border-subtle">
        {collapsed ? (
          /* Collapsed: small white pill with icon-only crop */
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              src={LOGO_URL}
              alt="Liberty Business"
              className="w-8 h-8 object-contain object-left"
              style={{ transform: 'scale(2.2) translateX(-30%)' }}
            />
          </div>
        ) : (
          /* Expanded: white pill with full logo */
          <div className="flex-1 bg-white rounded-xl px-3 py-2 flex items-center justify-center">
            <img
              src={LOGO_URL}
              alt="Liberty Business"
              className="h-8 w-auto object-contain"
            />
          </div>
        )}

        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex-shrink-0 text-text-muted hover:text-text-base transition-colors p-1"
          title={collapsed ? 'Expandir' : 'Contraer'}
        >
          {collapsed ? <RiMenuUnfoldLine size={18} /> : <RiMenuFoldLine size={18} />}
        </button>
      </div>

      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

        {/* Dashboard — all roles */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `${navBase} ${isActive ? navActive : navIdle}`}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <RiDashboardLine size={18} className="flex-shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {/* My Leads — vendedor + agent */}
        {(isVendedor || profile?.role === 'agent') && (
          <NavLink
            to="/my-leads"
            className={({ isActive }) => `${navBase} ${isActive ? navActive : navIdle}`}
            title={collapsed ? 'Mis Leads' : undefined}
          >
            <RiUserLine size={18} className="flex-shrink-0" />
            {!collapsed && <span>Mis Leads</span>}
          </NavLink>
        )}

        {/* All Leads — admin, co-admin, viewer */}
        {(isAdmin || isCoAdmin || isViewer) && (
          <NavLink
            to="/leads"
            className={({ isActive }) => `${navBase} ${isActive ? navActive : navIdle}`}
            title={collapsed ? 'Todos los Leads' : undefined}
          >
            <RiFileList3Line size={18} className="flex-shrink-0" />
            {!collapsed && <span>Todos los Leads</span>}
          </NavLink>
        )}

        {/* Import Leads — admin, co-admin */}
        {canImport && (
          <NavLink
            to="/import-leads"
            className={({ isActive }) => `${navBase} ${isActive ? navActive : navIdle}`}
            title={collapsed ? 'Importar Leads' : undefined}
          >
            <RiUploadLine size={18} className="flex-shrink-0" />
            {!collapsed && <span>Importar Leads</span>}
          </NavLink>
        )}

        {/* Team / Users — admin, co-admin */}
        {canInvite && (
          <NavLink
            to="/users"
            className={({ isActive }) => `${navBase} ${isActive ? navActive : navIdle}`}
            title={collapsed ? 'Equipo' : undefined}
          >
            <RiTeamLine size={18} className="flex-shrink-0" />
            {!collapsed && <span>Equipo</span>}
          </NavLink>
        )}
      </nav>

      {/* ── User footer ─────────────────────────────────── */}
      <div className="border-t border-border-subtle px-2 py-3">
        {!collapsed && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-text-base truncate">
              {profile?.full_name ?? profile?.email ?? '—'}
            </p>
            <p className="text-xs text-text-muted mt-0.5">{roleLabel}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={`${navBase} ${navIdle} w-full`}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <RiLogoutBoxLine size={18} className="flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
