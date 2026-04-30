import { useMemo } from 'react'
import { RiMedalLine, RiTrophyLine } from 'react-icons/ri'

const RANK_COLORS = {
  0: 'text-yellow-400 bg-yellow-400/10',
  1: 'text-slate-300 bg-slate-300/10',
  2: 'text-amber-600 bg-amber-600/10',
}

export default function Leaderboard({ leads, agents, loading }) {
  const leaderboardData = useMemo(() => {
    if (!leads.length || !agents.length) return []

    return agents.map(agent => {
      const agentLeads = leads.filter(l => l.assigned_to === agent.id)
      const contacted = agentLeads.filter(l =>
        ['contacted', 'interested', 'proposal_sent', 'closed_won', 'closed_lost'].includes(l.status)
      ).length
      const proposalsSent = agentLeads.filter(l =>
        ['proposal_sent', 'closed_won', 'closed_lost'].includes(l.status)
      ).length
      const closedWon = agentLeads.filter(l => l.status === 'closed_won').length
      const convRate = agentLeads.length > 0 ? ((closedWon / agentLeads.length) * 100).toFixed(1) : '0.0'

      // Avg days to close
      const closedLeads = agentLeads.filter(l => l.status === 'closed_won' && l.closed_date && l.created_at)
      const avgDays = closedLeads.length > 0
        ? Math.round(
            closedLeads.reduce((sum, l) => {
              const days = (new Date(l.closed_date) - new Date(l.created_at)) / (1000 * 60 * 60 * 24)
              return sum + days
            }, 0) / closedLeads.length
          )
        : '—'

      return {
        agent,
        totalLeads: agentLeads.length,
        contacted,
        proposalsSent,
        closedWon,
        convRate: parseFloat(convRate),
        avgDays,
      }
    }).sort((a, b) => b.convRate - a.convRate)
  }, [leads, agents])

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!leaderboardData.length) {
    return (
      <div className="text-center py-10">
        <RiTrophyLine size={32} className="mx-auto text-text-muted mb-2" />
        <p className="text-text-muted text-sm">No data yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="table-header w-8">#</th>
            <th className="table-header">Agent</th>
            <th className="table-header text-right">Total</th>
            <th className="table-header text-right">Contacted</th>
            <th className="table-header text-right">Proposals</th>
            <th className="table-header text-right">Won</th>
            <th className="table-header text-right">Conv. Rate</th>
            <th className="table-header text-right">Avg Days</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {leaderboardData.map((row, i) => (
            <tr key={row.agent.id} className="hover:bg-bg-elevated/50 transition-colors">
              <td className="table-cell w-8">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${RANK_COLORS[i] || 'text-text-muted bg-bg-elevated'}`}>
                  {i < 3 ? <RiMedalLine size={14} /> : i + 1}
                </div>
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs text-accent-blue font-semibold">
                    {row.agent.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{row.agent.full_name}</p>
                    <p className="text-xs text-text-muted">{row.agent.email}</p>
                  </div>
                </div>
              </td>
              <td className="table-cell text-right text-text-secondary">{row.totalLeads}</td>
              <td className="table-cell text-right text-text-secondary">{row.contacted}</td>
              <td className="table-cell text-right text-text-secondary">{row.proposalsSent}</td>
              <td className="table-cell text-right font-semibold text-emerald-400">{row.closedWon}</td>
              <td className="table-cell text-right">
                <span className={`font-semibold ${row.convRate >= 30 ? 'text-emerald-400' : row.convRate >= 15 ? 'text-yellow-400' : 'text-text-secondary'}`}>
                  {row.convRate}%
                </span>
              </td>
              <td className="table-cell text-right text-text-secondary">{row.avgDays}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
