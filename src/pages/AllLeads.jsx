import { useState, useEffect, useMemo } from 'react'
import { RiDownloadLine, RiFilterLine, RiLoader4Line } from 'react-icons/ri'
import LeadTable from '../components/LeadTable'
import AddLeadModal from '../components/AddLeadModal'
import LeadStatusBadge, { STATUS_CONFIG } from '../components/LeadStatusBadge'
import { useLeads } from '../hooks/useLeads'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

export default function AllLeads() {
  const [filters, setFilters] = useState({})
  const { leads, loading, createLead, bulkUpdateStatus } = useLeads(filters)
  const [agents, setAgents] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('is_active', true)
      .then(({ data }) => setAgents(data || []))
  }, [])

  function handleFilterChange(key, value) {
    setFilters(f => ({ ...f, [key]: value || undefined }))
  }

  async function handleBulkUpdate() {
    if (!selectedIds.length || !bulkStatus) return
    setBulkUpdating(true)
    const { error } = await bulkUpdateStatus(selectedIds, bulkStatus)
    setBulkUpdating(false)
    if (error) toast.error('Bulk update failed')
    else {
      toast.success(`Updated ${selectedIds.length} leads`)
      setSelectedIds([])
      setBulkStatus('')
    }
  }

  function exportCSV() {
    const headers = ['Client Name', 'Email', 'Phone', 'Company', 'Assigned To', 'Status', 'Source', 'Created']
    const rows = leads.map(l => [
      l.client_name,
      l.client_email,
      l.client_phone,
      l.company,
      l.profiles?.full_name,
      l.status,
      l.source,
      new Date(l.created_at).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Filter Bar */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <RiFilterLine size={16} className="text-text-muted" />
          <span className="text-sm font-medium text-text-secondary">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            onChange={e => handleFilterChange('assigned_to', e.target.value)}
            className="select-field w-44"
          >
            <option value="">All Agents</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </select>
          <select
            onChange={e => handleFilterChange('status', e.target.value)}
            className="select-field w-44"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <input
            type="date"
            onChange={e => handleFilterChange('dateFrom', e.target.value)}
            className="input-field w-40"
            placeholder="From date"
          />
          <input
            type="date"
            onChange={e => handleFilterChange('dateTo', e.target.value)}
            className="input-field w-40"
            placeholder="To date"
          />
          <button onClick={exportCSV} className="btn-secondary ml-auto">
            <RiDownloadLine size={16} /> Export CSV
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            + Add Lead
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 bg-accent-blue/10 border border-accent-blue/30 rounded-xl px-4 py-3 animate-fade-in">
          <span className="text-sm font-medium text-accent-blue">{selectedIds.length} selected</span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            className="select-field w-44 !bg-bg-card"
          >
            <option value="">Change status to...</option>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            onClick={handleBulkUpdate}
            disabled={!bulkStatus || bulkUpdating}
            className="btn-primary"
          >
            {bulkUpdating ? <><RiLoader4Line size={14} className="animate-spin" /> Updating...</> : 'Apply'}
          </button>
          <button onClick={() => setSelectedIds([])} className="btn-ghost text-sm ml-auto">
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <LeadTable
        leads={leads}
        loading={loading}
        showAgent
        selectedIds={selectedIds}
        onSelectIds={setSelectedIds}
      />

      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onSave={createLead}
          agents={agents}
        />
      )}
    </div>
  )
}
