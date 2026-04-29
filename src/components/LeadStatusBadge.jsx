const STATUS_CONFIG = {
  new: { label: 'New', classes: 'bg-slate-700/60 text-slate-300 border-slate-600' },
  contacted: { label: 'Contacted', classes: 'bg-blue-900/50 text-blue-300 border-blue-700' },
  interested: { label: 'Interested', classes: 'bg-yellow-900/50 text-yellow-300 border-yellow-700' },
  not_interested: { label: 'Not Interested', classes: 'bg-red-900/50 text-red-400 border-red-800' },
  proposal_sent: { label: 'Proposal Sent', classes: 'bg-purple-900/50 text-purple-300 border-purple-700' },
  closed_won: { label: 'Closed Won', classes: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' },
  closed_lost: { label: 'Closed Lost', classes: 'bg-red-950/70 text-red-500 border-red-900' },
}

export default function LeadStatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${config.classes} ${sizeClasses} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getDotColor(status)}`} />
      {config.label}
    </span>
  )
}

function getDotColor(status) {
  const colors = {
    new: 'bg-slate-400',
    contacted: 'bg-blue-400',
    interested: 'bg-yellow-400',
    not_interested: 'bg-red-500',
    proposal_sent: 'bg-purple-400',
    closed_won: 'bg-emerald-400',
    closed_lost: 'bg-red-600',
  }
  return colors[status] || 'bg-slate-400'
}

export { STATUS_CONFIG }
