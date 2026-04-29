import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { RiArrowRightLine, RiSearchLine, RiFilterLine } from 'react-icons/ri'
import LeadStatusBadge, { STATUS_CONFIG } from './LeadStatusBadge'

const ACTION_TYPE_LABELS = {
  call: 'Call',
  meeting: 'Meeting',
  email: 'Email',
  follow_up: 'Follow-up',
  proposal_sent: 'Proposal',
  note: 'Note',
}

export default function LeadTable({
  leads,
  loading,
  showAgent = false,
  onAddLead,
  selectedIds,
  onSelectIds,
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = leads.filter(lead => {
    const matchSearch = !search ||
      lead.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(search.toLowerCase()) ||
      lead.client_email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || lead.status === statusFilter
    return matchSearch && matchStatus
  })

  function getLastAction(lead) {
    const actions = lead.lead_actions || []
    if (!actions.length) return null
    return actions.sort((a, b) => new Date(b.action_date) - new Date(a.action_date))[0]
  }

  function handleSelectAll(e) {
    if (!onSelectIds) return
    onSelectIds(e.target.checked ? filtered.map(l => l.id) : [])
  }

  function handleSelectOne(id, checked) {
    if (!onSelectIds || !selectedIds) return
    onSelectIds(checked ? [...selectedIds, id] : selectedIds.filter(i => i !== id))
  }

  if (loading) {
    return (
      <div className="card">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-5 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border-subtle">
        <div className="relative flex-1">
          <RiSearchLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, company, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="select-field sm:w-44"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {onAddLead && (
          <button onClick={onAddLead} className="btn-primary whitespace-nowrap">
            + Add Lead
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
            <RiFilterLine size={24} className="text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium mb-1">No leads found</p>
          <p className="text-text-muted text-sm">
            {search || statusFilter ? 'Try adjusting your filters' : 'Add your first lead to get started'}
          </p>
          {onAddLead && !search && !statusFilter && (
            <button onClick={onAddLead} className="btn-primary mt-4">+ Add First Lead</button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-elevated/50">
                {onSelectIds && (
                  <th className="table-header w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds?.length === filtered.length && filtered.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-border-DEFAULT bg-bg-elevated"
                    />
                  </th>
                )}
                <th className="table-header">Client</th>
                <th className="table-header">Company</th>
                {showAgent && <th className="table-header">Agent</th>}
                <th className="table-header">Status</th>
                <th className="table-header hidden md:table-cell">Last Action</th>
                <th className="table-header hidden lg:table-cell">Created</th>
                <th className="table-header w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map(lead => {
                const lastAction = getLastAction(lead)
                return (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="hover:bg-bg-elevated/50 cursor-pointer transition-colors duration-100 group"
                  >
                    {onSelectIds && (
                      <td className="table-cell w-10" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds?.includes(lead.id)}
                          onChange={e => handleSelectOne(lead.id, e.target.checked)}
                          className="rounded border-border-DEFAULT bg-bg-elevated"
                        />
                      </td>
                    )}
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-text-primary">{lead.client_name}</p>
                        <p className="text-xs text-text-muted">{lead.client_email}</p>
                      </div>
                    </td>
                    <td className="table-cell text-text-secondary">{lead.company || '—'}</td>
                    {showAgent && (
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs text-accent-blue font-semibold">
                            {lead.profiles?.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="text-sm text-text-secondary">{lead.profiles?.full_name}</span>
                        </div>
                      </td>
                    )}
                    <td className="table-cell">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      {lastAction ? (
                        <div>
                          <p className="text-sm text-text-secondary">{ACTION_TYPE_LABELS[lastAction.action_type]}</p>
                          <p className="text-xs text-text-muted">
                            {format(new Date(lastAction.action_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-text-muted text-sm">No actions</span>
                      )}
                    </td>
                    <td className="table-cell hidden lg:table-cell text-text-muted text-sm">
                      {format(new Date(lead.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="table-cell">
                      <RiArrowRightLine
                        size={16}
                        className="text-text-muted group-hover:text-accent-blue transition-colors"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="px-4 py-3 border-t border-border-subtle">
          <p className="text-xs text-text-muted">
            Showing {filtered.length} of {leads.length} leads
          </p>
        </div>
      )}
    </div>
  )
}
