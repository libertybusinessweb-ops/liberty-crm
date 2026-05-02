import { useMemo, useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format, subMonths, startOfMonth, eachWeekOfInterval, startOfWeek } from 'date-fns'
import {
  RiGroupLine, RiTrophyLine, RiPercentLine, RiTimeLine,
  RiFlashlightLine,
} from 'react-icons/ri'
import KPICard from '../components/KPICard'
import Leaderboard from '../components/Leaderboard'
import { useLeads } from '../hooks/useLeads'
import { useRecentActivity } from '../hooks/useActions'
import { supabase } from '../lib/supabaseClient'

const STATUS_COLORS = {
  new: '#64748b',
  contacted: '#3b82f6',
  interested: '#f59e0b',
  not_interested: '#ef4444',
  proposal_sent: '#8b5cf6',
  closed_won: '#10b981',
  closed_lost: '#dc2626',
}

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-text-muted mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { leads, loading } = useLeads()
  const { activities, loading: activitiesLoading } = useRecentActivity(10)
  const [agents, setAgents] = useState([])

  useEffect(() => {
    supabase.from('profiles').select('*').eq('is_active', true).then(({ data }) => {
      setAgents(data || [])
    })
  }, [])

  const kpis = useMemo(() => {
    const total = leads.length
    const closedWon = leads.filter(l => l.status === 'closed_won').length
    const convRate = total > 0 ? ((closedWon / total) * 100).toFixed(1) : '0.0'

    const closedWithDates = leads.filter(l =>
      l.status === 'closed_won' && l.closed_date && l.created_at
    )
    const avgDays = closedWithDates.length > 0
      ? Math.round(
          closedWithDates.reduce((sum, l) => {
            return sum + (new Date(l.closed_date) - new Date(l.created_at)) / (1000 * 60 * 60 * 24)
          }, 0) / closedWithDates.length
        )
      : null

    return { total, closedWon, convRate, avgDays }
  }, [leads])

  const statusChartData = useMemo(() => {
    const counts = {}
    leads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1 })
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count,
      fill: STATUS_COLORS[status] || '#64748b',
    }))
  }, [leads])

  const timelineData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(new Date(), 5 - i)
      const label = format(month, 'MMM')
      const start = startOfMonth(month)
      const end = startOfMonth(subMonths(month, -1))
      const count = leads.filter(l => {
        const d = new Date(l.created_at)
        return d >= start && d < end
      }).length
      return { label, count }
    })
    return months
  }, [leads])

  const sourceData = useMemo(() => {
    const counts = {}
    leads.forEach(l => {
      const src = l.source || 'other'
      counts[src] = (counts[src] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value,
    }))
  }, [leads])

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Leads" value={kpis.total} icon={RiGroupLine} color="blue" loading={loading} subtitle="All time" />
        <KPICard title="Closed Won" value={kpis.closedWon} icon={RiTrophyLine} color="green" loading={loading} subtitle="All time" />
        <KPICard title="Conversion Rate" value={`${kpis.convRate}%`} icon={RiPercentLine} color="yellow" loading={loading} subtitle="Won / Total" />
        <KPICard title="Avg. Days to Close" value={kpis.avgDays ?? '—'} icon={RiTimeLine} color="purple" loading={loading} subtitle="From created to closed" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Bar Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Leads by Status</h3>
          {loading ? (
            <div className="skeleton h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Source Pie Chart */}
        <div className="card">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Lead Sources</h3>
          {loading ? (
            <div className="skeleton h-48 w-full rounded-lg" />
          ) : sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(v) => <span className="text-xs text-text-secondary">{v}</span>}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Timeline & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads Over Time */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Leads Created (Last 6 Months)</h3>
          {loading ? (
            <div className="skeleton h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timelineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Leads"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <RiFlashlightLine size={16} className="text-accent-blue" />
            <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
          </div>
          {activitiesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-6">No activity yet</p>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {activities.map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent-blue/15 flex items-center justify-center flex-shrink-0 text-xs text-accent-blue font-bold mt-0.5">
                    {a.profiles?.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-text-primary leading-snug">
                      <span className="font-semibold">{a.profiles?.full_name}</span>
                      {' '}{a.action_type.replace('_', ' ')} on{' '}
                      <span className="text-accent-blue">{a.leads?.client_name}</span>
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {format(new Date(a.created_at), 'MMM d · h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <RiTrophyLine size={18} className="text-yellow-400" />
          <h3 className="text-base font-bold text-text-primary">Agent Leaderboard</h3>
        </div>
        <Leaderboard leads={leads} agents={agents} loading={loading} />
      </div>
    </div>
  )
}
