export default function KPICard({ title, value, subtitle, icon: Icon, trend, color = 'blue', loading }) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-emerald-400 bg-emerald-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    red: 'text-red-400 bg-red-500/10',
  }

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-8 w-16 mb-2" />
        <div className="skeleton h-3 w-32" />
      </div>
    )
  }

  return (
    <div className="card hover:border-border-DEFAULT transition-colors duration-200">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon size={18} className={colorMap[color].split(' ')[0]} />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-text-primary mb-1">{value ?? '—'}</p>
      {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
          <span className="text-text-muted">vs last month</span>
        </div>
      )}
    </div>
  )
}
