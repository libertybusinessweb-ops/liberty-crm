import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  RiUserLine, RiShieldLine, RiToggleLine, RiToggleFill, RiLoader4Line,
  RiMailSendLine, RiAddLine, RiCloseLine, RiCheckLine, RiTimeLine, RiTeamLine,
  RiEyeLine, RiStore2Line, RiAdminLine,
} from 'react-icons/ri'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const ROLE_CONFIG = {
  admin:     { label: 'Administrador', color: 'text-red-400   bg-red-400/10',   icon: RiAdminLine   },
  'co-admin':{ label: 'Co-Admin',      color: 'text-orange-400 bg-orange-400/10', icon: RiShieldLine },
  viewer:    { label: 'Viewer',        color: 'text-sky-400   bg-sky-400/10',    icon: RiEyeLine    },
  vendedor:  { label: 'Vendedor',      color: 'text-emerald-400 bg-emerald-400/10', icon: RiStore2Line },
  agent:     { label: 'Vendedor',      color: 'text-emerald-400 bg-emerald-400/10', icon: RiStore2Line },
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, color: 'text-text-muted bg-white/5', icon: RiUserLine }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  )
}

export default function UserManagement() {
  const { user: currentUser, isAdmin, profile } = useAuth()
  const [users,        setUsers]        = useState([])
  const [invitations,  setInvitations]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [updatingId,   setUpdatingId]   = useState(null)
  const [showInvForm,  setShowInvForm]  = useState(false)
  const [invForm,      setInvForm]      = useState({ email: '', role: 'vendedor', full_name: '' })
  const [inviting,     setInviting]     = useState(false)
  const [tab,          setTab]          = useState('users') // 'users' | 'invitations'

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [usersRes, invRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('invitations').select('*').order('created_at', { ascending: false }),
    ])
    if (usersRes.error) toast.error('Error al cargar usuarios')
    else setUsers(usersRes.data || [])
    if (!invRes.error) setInvitations(invRes.data || [])
    setLoading(false)
  }

  async function toggleActive(userId, current) {
    setUpdatingId(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !current })
      .eq('id', userId)
    if (error) toast.error('Error al actualizar')
    else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !current } : u))
      toast.success(!current ? 'Usuario activado' : 'Usuario desactivado')
    }
    setUpdatingId(null)
  }

  async function updateRole(userId, newRole) {
    setUpdatingId(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (error) toast.error('Error al cambiar rol')
    else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast.success('Rol actualizado')
    }
    setUpdatingId(null)
  }

  async function sendInvitation(e) {
    e.preventDefault()
    if (!invForm.email) { toast.error('Ingresa un email'); return }
    setInviting(true)
    try {
      // Create invitation record
      const { data: inv, error } = await supabase
        .from('invitations')
        .insert({
          email:      invForm.email.toLowerCase().trim(),
          role:       invForm.role,
          full_name:  invForm.full_name || null,
          invited_by: currentUser.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      const inviteUrl = `${window.location.origin}/accept-invite?token=${inv.token}`

      // Open mailto for easy sharing
      const subject = encodeURIComponent('Invitación al CRM de Liberty Business')
      const body = encodeURIComponent(
        `Hola${invForm.full_name ? ' ' + invForm.full_name : ''},\n\n` +
        `Has sido invitado al CRM de Liberty Business como ${ROLE_CONFIG[invForm.role]?.label ?? invForm.role}.\n\n` +
        `Haz clic en el siguiente enlace para crear tu cuenta:\n${inviteUrl}\n\n` +
        `El enlace expira en 7 días.\n\nSaludos,\n${profile?.full_name ?? 'El equipo de Liberty Business'}`
      )
      window.open(`mailto:${invForm.email}?subject=${subject}&body=${body}`)

      toast.success(`Invitación creada para ${invForm.email}`)
      setInvitations(prev => [inv, ...prev])
      setInvForm({ email: '', role: 'vendedor', full_name: '' })
      setShowInvForm(false)
      setTab('invitations')
    } catch (err) {
      toast.error(err.message ?? 'Error al crear invitación')
    } finally {
      setInviting(false)
    }
  }

  async function revokeInvitation(id) {
    const { error } = await supabase.from('invitations').delete().eq('id', id)
    if (error) toast.error('Error al revocar')
    else {
      setInvitations(prev => prev.filter(i => i.id !== id))
      toast.success('Invitación revocada')
    }
  }

  const isExpired = (inv) => new Date(inv.expires_at) < new Date()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-base">Equipo</h1>
          <p className="text-sm text-text-muted mt-0.5">Gestiona usuarios e invitaciones</p>
        </div>
        <button
          onClick={() => setShowInvForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <RiAddLine size={18} />
          Invitar usuario
        </button>
      </div>

      {/* Invite Form Modal */}
      {showInvForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-text-base">Invitar nuevo usuario</h2>
              <button onClick={() => setShowInvForm(false)} className="text-text-muted hover:text-text-base">
                <RiCloseLine size={20} />
              </button>
            </div>

            <form onSubmit={sendInvitation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Email *</label>
                <input
                  type="email" required
                  value={invForm.email}
                  onChange={e => setInvForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="usuario@empresa.com"
                  className="w-full px-3 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-base placeholder-text-muted text-sm focus:outline-none focus:border-accent-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Nombre (opcional)</label>
                <input
                  type="text"
                  value={invForm.full_name}
                  onChange={e => setInvForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Nombre del usuario"
                  className="w-full px-3 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-base placeholder-text-muted text-sm focus:outline-none focus:border-accent-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Rol *</label>
                <select
                  value={invForm.role}
                  onChange={e => setInvForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-base text-sm focus:outline-none focus:border-accent-blue"
                >
                  {isAdmin && <option value="co-admin">Co-Admin — Importar, reasignar, reportes</option>}
                  <option value="vendedor">Vendedor — Gestionar sus leads asignados</option>
                  <option value="viewer">Viewer — Solo lectura (ejecutivos)</option>
                </select>
              </div>

              <div className="pt-1">
                <p className="text-xs text-text-muted mb-3 flex items-start gap-1.5">
                  <RiMailSendLine size={14} className="mt-0.5 flex-shrink-0 text-accent-blue" />
                  Se abrirá tu cliente de email con la invitación lista para enviar. El enlace expira en 7 días.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInvForm(false)}
                    className="flex-1 py-2.5 border border-border-subtle rounded-xl text-text-muted hover:text-text-base text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 py-2.5 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {inviting ? <RiLoader4Line className="animate-spin" size={16} /> : <RiMailSendLine size={16} />}
                    Enviar invitación
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-surface/50 border border-border-subtle rounded-xl p-1 w-fit">
        {['users', 'invitations'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-base'
            }`}
          >
            {t === 'users' ? `Usuarios (${users.length})` : `Invitaciones (${invitations.filter(i => !i.accepted_at && !isExpired(i)).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><RiLoader4Line className="animate-spin text-accent-blue" size={28} /></div>
      ) : tab === 'users' ? (
        /* ── Users table ── */
        <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Desde</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                        <RiUserLine size={14} className="text-accent-blue" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-base">{u.full_name || '—'}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {u.id === currentUser?.id ? (
                      <RoleBadge role={u.role} />
                    ) : (
                      <select
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value)}
                        disabled={updatingId === u.id}
                        className="bg-bg-base border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-base focus:outline-none focus:border-accent-blue"
                      >
                        {isAdmin && <option value="admin">Administrador</option>}
                        <option value="co-admin">Co-Admin</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.is_active ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
                    }`}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-text-muted">
                    {u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => toggleActive(u.id, u.is_active)}
                        disabled={updatingId === u.id}
                        className="text-text-muted hover:text-text-base transition-colors disabled:opacity-40"
                        title={u.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {updatingId === u.id
                          ? <RiLoader4Line className="animate-spin" size={18} />
                          : u.is_active
                            ? <RiToggleFill size={22} className="text-accent-blue" />
                            : <RiToggleLine size={22} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Invitations table ── */
        <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden">
          {invitations.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <RiMailSendLine size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No hay invitaciones</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Expira</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {invitations.map(inv => {
                  const expired  = isExpired(inv)
                  const accepted = !!inv.accepted_at
                  return (
                    <tr key={inv.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-text-base">{inv.email}</p>
                        {inv.full_name && <p className="text-xs text-text-muted">{inv.full_name}</p>}
                      </td>
                      <td className="px-4 py-3.5"><RoleBadge role={inv.role} /></td>
                      <td className="px-4 py-3.5">
                        {accepted ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <RiCheckLine size={12} /> Aceptada
                          </span>
                        ) : expired ? (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <RiTimeLine size={12} /> Expirada
                          </span>
                        ) : (
                          <span className="text-xs text-amber-400">Pendiente</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-text-muted">
                        {format(new Date(inv.expires_at), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3.5">
                        {!accepted && (
                          <button
                            onClick={() => revokeInvitation(inv.id)}
                            className="text-text-muted hover:text-red-400 transition-colors"
                            title="Revocar"
                          >
                            <RiCloseLine size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
