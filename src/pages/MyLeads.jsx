import { useMemo, useState, useEffect } from 'react'
import { RiGroupLine, RiDoorOpenLine, RiTrophyLine, RiPercentLine } from 'react-icons/ri'
import KPICard from '../components/KPICard'
import LeadTable from '../components/LeadTable'
import AddLeadModal from '../components/AddLeadModal'
import { useLeads } from '../hooks/useLeads'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function MyLeads() {
  const { leads, loading, createLead } = useLeads()
  const { isAdmin } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [agents, setAgents] = useState([])

  useEffect(() => {
    if (isAdmin) {
      supabase.from('profiles').select('*').eq('is_active', true)
        .then(({ data }) => setAgents(data || []))
    }
  }, [isAdmin])

  const kpis = useMemo(() => {
    const total = leads.length
    const open = leads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length
    const closedWon = leads.filter(l => l.status === 'closed_won').length
    const convRate = total > 0 ? ((closedWon / total) * 100).toFixed(1) : '0.0'
    return { total, open, closedWon, convRate }
  }, [leads])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="My Total Leads" value={kpis.total} icon={RiGroupLine} color="blue" loading={loading} />
        <KPICard title="Open Leads" value={kpis.open} icon={RiDoorOpenLine} color="yellow" loading={loading} />
        <KPICard title="Closed Won" value={kpis.closedWon} icon={RiTrophyLine} color="green" loading={loading} />
        <KPICard title="Conversion Rate" value={`${kpis.convRate}%`} icon={RiPercentLine} color="purple" loading={loading} />
      </div>

      {/* Table */}
      <LeadTable
        leads={leads}
        loading={loading}
        showAgent={isAdmin}
        onAddLead={() => setShowAddModal(true)}
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
