import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  RiUserLine, RiLoader4Line, RiSearchLine, RiCheckLine,
  RiCloseLine, RiChat3Line, RiSendPlane2Line, RiArrowRightLine,
} from 'react-icons/ri'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'new',          label: 'Nuevo',          color: 'bg-slate-400/15  text-slate-300'   },
  { value: 'interested',   label: 'Interesado',      color: 'bg-blue-400/15   text-blue-300'    },
  { value: 'in_progress',  label: 'En progreso',     color: 'bg-amber-400/15  text-amber-300'   },
  { value: 'closed_won',   label: 'Cerrado / Ganado', color: 'bg-emerald-400/15 text-emerald-300'},
  { value: 'closed_lost',  label: 'Cerrado / Perdido', color: 'bg-red-400/15  text-red-300'     },
]

function StatusBadge({ status }) {
  const opt = STATUS_OPTIONS.find(s => s.value === status) ?? STATUS_OPTIONS[0]
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${opt.color}`}>
      {opt.label}
    </span>
  )
}

export default function MyLeads() {
  const { user } = useAuth()
  const [leads,    setLeads]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [active,   setActive]   = useState(null)   // expanded lead id
  const [comments, setComments] = useState({})      // { leadId: [] }
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)

  useEffect(() => { fetchLeads() }, [user])

  async function fetchLeads() {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
    if (error) toast.error('Error al cargar leads')
    else setLeads(data || [])
    setLoading(false)
  }

  async function fetchComments(leadId) {
    const { data } = await supabase
      .from('lead_comments')
      .select('*, profiles(full_name, email)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    setComments(c => ({ ...c, [leadId]: data || [] }))
  }

  async function toggleExpand(leadId) {
    if (active === leadId) { setActive(null); return }
    setActive(leadId)
    if (!comments[leadId]) fetchComments(leadId)
  }

  async function updateStatus(leadId, newStatus) {
    setUpdatingStatus(leadId)
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId)
    if (error) toast.error('Error al actualizar estado')
    else {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
      toast.success('Estado actualizado')
    }
    setUpdatingStatus(null)
  }

  async function addComment(leadId) {
    if (!newComment.trim()) return
    setSendingComment(true)
    const { data, error } = await supabase
      .from('lead_comments')
      .insert({ lead_id: leadId, user_id: user.id, comment: newComment.trim() })
      .select('*, profiles(full_name, email)')
      .single()
    if (error) toast.error('Error al agregar comentario')
    else {
      setComments(c => ({ ...c, [leadId]: [...(c[leadId] || []), data] }))
      setNewComment('')
      toast.success('Comentario agregado')
    }
    setSendingComment(false)
  }

  const filtered = leads.filter(l => {
    const matchSearch = !search ||
      l.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.client_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.company?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || l.status === filter
    return matchSearch && matchFilter
  })

  const stats = {
    total:    leads.length,
    active:   leads.filter(l => !['closed_won','closed_lost'].includes(l.status)).length,
    won:      leads.filter(l => l.status === 'closed_won').length,
    pending:  leads.filter(l => l.status === 'new').length,
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-base">Mis Leads</h1>
        <p className="text-sm text-text-muted mt-0.5">Leads asignados a ti</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',    value: stats.total,   color: 'text-text-base'    },
          { label: 'Activos',  value: stats.active,  color: 'text-blue-400'     },
          { label: 'Ganados',  value: stats.won,     color: 'text-emerald-400'  },
          { label: 'Nuevos',   value: stats.pending, color: 'text-amber-400'    },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border-subtle rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
          <input
            type="text"
            placeholder="Buscar leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border-subtle rounded-xl text-sm text-text-base placeholder-text-muted focus:outline-none focus:border-accent-blue"
          />
        </div>
        <div className="flex gap-1 bg-surface border border-border-subtle rounded-xl p-1 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === 'all' ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-base'}`}
          >Todos</button>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === s.value ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-base'}`}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Lead list */}
      {loading ? (
        <div className="flex justify-center py-16"><RiLoader4Line className="animate-spin text-accent-blue" size={28} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <RiUserLine size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search || filter !== 'all' ? 'Sin resultados' : 'No tienes leads asignados'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
              {/* Lead row */}
              <div className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-sm font-medium text-text-base truncate">{lead.client_name}</p>
                    <StatusBadge status={lead.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted flex-wrap">
                    {lead.company     && <span>{lead.company}</span>}
                    {lead.client_email && <span className="truncate">{lead.client_email}</span>}
                    {lead.client_phone && <span>{lead.client_phone}</span>}
                  </div>
                </div>

                {/* Quick status change */}
                <select
                  value={lead.status}
                  onChange={e => updateStatus(lead.id, e.target.value)}
                  disabled={updatingStatus === lead.id}
                  onClick={e => e.stopPropagation()}
                  className="bg-bg-base border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-base focus:outline-none focus:border-accent-blue flex-shrink-0"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleExpand(lead.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      active === lead.id
                        ? 'bg-accent-blue/20 text-accent-blue'
                        : 'text-text-muted hover:bg-white/5'
                    }`}
                    title="Comentarios"
                  >
                    <RiChat3Line size={14} />
                    {comments[lead.id]?.length > 0 && <span>{comments[lead.id].length}</span>}
                  </button>
                  <Link
                    to={`/leads/${lead.id}`}
                    className="text-text-muted hover:text-accent-blue transition-colors p-1.5"
                    title="Ver detalle"
                  >
                    <RiArrowRightLine size={16} />
                  </Link>
                </div>
              </div>

              {/* Comments panel */}
              {active === lead.id && (
                <div className="border-t border-border-subtle bg-bg-base/50 px-4 py-3">
                  <p className="text-xs font-medium text-text-muted mb-3">Comentarios</p>

                  {/* Comment list */}
                  <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {(comments[lead.id] || []).length === 0 ? (
                      <p className="text-xs text-text-muted italic">Sin comentarios aún.</p>
                    ) : (
                      (comments[lead.id] || []).map(c => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <RiUserLine size={11} className="text-accent-blue" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-text-base">
                                {c.profiles?.full_name || c.profiles?.email || 'Usuario'}
                              </span>
                              <span className="text-xs text-text-muted">
                                {format(new Date(c.created_at), 'dd MMM, HH:mm')}
                              </span>
                            </div>
                            <p className="text-xs text-text-muted mt-0.5">{c.comment}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* New comment input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addComment(lead.id)}
                      placeholder="Escribe un comentario..."
                      className="flex-1 px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-text-base placeholder-text-muted focus:outline-none focus:border-accent-blue"
                    />
                    <button
                      onClick={() => addComment(lead.id)}
                      disabled={sendingComment || !newComment.trim()}
                      className="px-3 py-2 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-40 text-white rounded-xl transition-colors"
                    >
                      {sendingComment
                        ? <RiLoader4Line className="animate-spin" size={14} />
                        : <RiSendPlane2Line size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
