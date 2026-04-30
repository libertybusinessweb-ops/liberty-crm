import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  RiDashboardLine, RiUserLine, RiGroupLine, RiFileList3Line,
  RiSettings3Line, RiLogoutBoxLine, RiMenuFoldLine, RiMenuUnfoldLine,
  RiBriefcaseLine,
} from 'react-icons/ri'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: RiDashboardLine, adminOnly: true },
  { path: '/my-leads', label: 'My Leads', icon: RiFileList3Line },
  { path: '/leads', label: 'All Leads', icon: RiGroupLine, adminOnly: true },
  { path: '/users', label: 'Team', icon: RiUserLine, adminOnly: true },
]

export default function Sidebar() {
  const { profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  async function handleSignOut() {
    const { error } = await signOut()
    if (error) {
      toast.error('Sign out failed')
    } else {
      navigate('/login')
    }
  }

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  return (
    <aside
      className={`flex flex-col bg-bg-card border-r border-border-subtle transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} min-h-screen flex-shrink-0`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-border-subtle ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center flex-shrink-0">
          <RiBriefcaseLine size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm text-text-primary leading-tight">Liberty CRM</p>
            <p className="text-xs text-text-muted leading-tight">Business Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {visibleItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 group ${
                isActive
                  ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-accent-blue' : ''}`} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-4 border-t border-border-subtle space-y-1">
        {/* User profile */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 text-accent-blue font-semibold text-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{profile?.full_name}</p>
              <p className="text-xs text-text-muted capitalize">{profile?.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-ghost w-full justify-center text-text-muted hover:text-text-primary"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <RiMenuUnfoldLine size={18} /> : <><RiMenuFoldLine size={18} />{!collapsed && <span>Collapse</span>}</>}
        </button>

        <button
          onClick={handleSignOut}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 w-full ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Sign out' : undefined}
        >
          <RiLogoutBoxLine size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
