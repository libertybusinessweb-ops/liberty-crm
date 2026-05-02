import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { RiUserLine, RiShieldLine, RiToggleLine, RiToggleFill, RiLoader4Line } from 'react-icons/ri'
import { supabase } from '../lib/supabaseClient'
import { useLeads } from '../hooks/useLeads'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { leads } = useLeads()
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) toast.error('Failed to load users')
    else setUsers(data || [])
    setLoading(false)
  }

  async function toggleActive(userId, currentActive) {
    if (userId === currentUser?.id) {
      toast.error("You can't deactivate yourself")
      return
    }
    setUpdatingId(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentActive })
      .eq('id', userId)
    setUpdatingId(null)
    if (error) toast.error('Update failed')
    else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentActive } : u))
      toast.success(`User ${!currentActive ? 'activated' : 'deactivated'}`)
    }
  }

  async function changeRole(userId, newRole) {
    if (userId === currentUser?.id) {
      toast.error("You can't change your own role")
      return
    }
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (error) toast.error('Role update failed')
    else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast.success('Role updated')
    }
  }

  function getLeadCount(userId) {
    return leads.filter(l => l.assigned_to === userId).length
  }

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm">{users.length} members total · {users.filter(u => u.is_active !== false).length} active</p>
        </div>
      </div>

      {/* Team note */}
      <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl px-4 py-3 text-sm text-text-secondary">
        <span className="font-medium text-accent-blue">Note:</span> New users must be created via the Supabase Auth Dashboard. After creation, their profile and role are managed here.
      </div>

      {/* User Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-elevated/50">
              <th className="table-header">Member</th>
              <th className="table-header">Role</th>
              <th className="table-header text-right">Leads Assigned</th>
              <th className="table-header hidden sm:table-cell">Date Added</th>
              <th className="table-header text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {users.map(u => {
              const isActive = u.is_active !== false
              const isSelf = u.id === currentUser?.id
              return (
                <tr key={u.id} className={`hover:bg-bg-elevated/30 transition-colors ${!isActive ? 'opacity-50' : ''}`}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        u.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-accent-blue/20 text-accent-blue'
                      }`}>
                        {u.full_name?.charAt(0)?.toUpperCase() || <RiUserLine size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {u.full_name}
                          {isSelf && <span className="ml-2 text-xs text-text-muted">(you)</span>}
                        </p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {isSelf ? (
                      <span className="text-sm font-medium text-text-secondary capitalize">{u.role}</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className="select-field w-28 text-xs"
                      >
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    <span className="font-semibold text-text-primary">{getLeadCount(u.id)}</span>
                  </td>
                  <td className="table-cell hidden sm:table-cell text-text-muted text-sm">
                    {format(new Date(u.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="table-cell text-center">
                    {isSelf ? (
                      <span className="text-xs text-text-muted">—</span>
                    ) : (
                      <button
                        onClick={() => toggleActive(u.id, isActive)}
                        disabled={updatingId === u.id}
                        className={`transition-colors ${isActive ? 'text-emerald-400 hover:text-red-400' : 'text-text-muted hover:text-emerald-400'}`}
                        title={isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {updatingId === u.id ? (
                          <RiLoader4Line size={22} className="animate-spin" />
                        ) : isActive ? (
                          <RiToggleFill size={22} />
                        ) : (
                          <RiToggleLine size={22} />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
