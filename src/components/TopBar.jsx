import { useLocation } from 'react-router-dom'
import { RiBellLine, RiSearchLine } from 'react-icons/ri'
import { useAuth } from '../context/AuthContext'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/my-leads': 'My Leads',
  '/leads': 'All Leads',
  '/users': 'Team Management',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const { profile } = useAuth()

  const title = PAGE_TITLES[pathname] || (pathname.startsWith('/leads/') ? 'Lead Detail' : 'Liberty CRM')

  return (
    <header className="bg-bg-card border-b border-border-subtle px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        <p className="text-xs text-text-muted mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors">
          <RiBellLine size={20} />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <div className="w8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue font-semibold">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text-primary leading-tight">{profile?.full_name}</p>
            <p className="text-xs text-text-muted capitalize leading-tight">{profile?.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
