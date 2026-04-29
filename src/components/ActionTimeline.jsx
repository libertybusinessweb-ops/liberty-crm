import { useState } from 'react'
import { format } from 'date-fns'
import {
  RiPhoneLine, RiCalendarLine, RiMailLine, RiRefreshLine,
  RiFileTextLine, RiStickyNoteLine, RiDeleteBinLine,
} from 'react-icons/ri'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ACTION_ICONS = {
  call: RiPhoneLine,
  meeting: RiCalendarLine,
  email: RiMailLine,
  follow_up: RiRefreshLine,
  proposal_sent: RiFileTextLine,
  note: RiStickyNoteLine,
}

const ACTION_COLORS = {
  call: 'text-blue-400 bg-blue-400/10',
  meeting: 'text-purple-400 bg-purple-400/10',
  email: 'text-yellow-400 bg-yellow-400/10',
  follow_up: 'text-orange-400 bg-orange-400/10',
  proposal_sent: 'text-indigo-400 bg-indigo-400/10',
  note: 'text-slate-400 bg-slate-400/10',
}

const OUTCOME_BADGES = {
  no_response: 'bg-slate-700/60 text-slate-400',
  response: 'bg-blue-900/50 text-blue-300',
  interested: 'bg-yellow-900/50 text-yellow-300',
  not_interested: 'bg-red-900/50 text-red-400',
  sold: 'bg-emerald-900/50 text-emerald-300',
  lost: 'bg-red-950/70 text-red-500',
  other: 'bg-slate-700/60 text-slate-400',
}

const OUTCOME_LABELS = {
  no_response: 'No Response',
  response: 'Response',
  interested: 'Interested',
  not_interested: 'Not Interested',
  sold: 'Sold',
  lost: 'Lost',
  other: 'Other',
}

export default function ActionTimeline({ actions, loading, onDelete }) {
  const { isAdmin, user } = useAuth()

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!actions.length) {
    return (
      <div className="text-center py-10">
        <RiStickyNoteLine size={32} className="mx-auto text-text-muted mb-3" />
        <p className="text-text-secondary font-medium">No actions logged yet</p>
        <p className="text-text-muted text-sm">Log your first interaction above</p>
      </div>
    )
  }

  async function handleDelete(actionId) {
    if (!confirm('Delete this action?')) return
    const { error } = await onDelete(actionId)
    if (error) toast.error('Failed to delete action')
    else toast.success('Action deleted')
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-border-subtle" />

      <div className="space-y-4">
        {actions.map(action => {
          const Icon = ACTION_ICONS[action.action_type] || RiStickyNoteLine
          const colorClass = ACTION_COLORS[action.action_type] || ACTION_COLORS.note
          const canDelete = isAdmin || action.agent_id === user?.id

          return (
            <div key={action.id} className="flex gap-4 relative group animate-fade-in">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${colorClass}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 bg-bg-elevated rounded-xl p-4 border border-border-subtle">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-semibold text-text-primary capitalize">
                      {action.action_type.replace('_', ' ')}
                    </span>
                    {action.outcome && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${OUTCOME_BADGES[action.outcome]}`}>
                        {OUTCOME_LABELS[action.outcome]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-text-muted">
                      {format(new Date(action.action_date), 'MMM d, yyyy · h:mm a')}
                    </span>
                    {canDelete && onDelete && (
                      <button
                        onClick={() => handleDelete(action.id)}
                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all p-0.5"
                      >
                        <RiDeleteBinLine size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {action.notes && (
                  <p className="text-sm text-text-secondary leading-relaxed">{action.notes}</p>
                )}
                <p className="text-xs text-text-muted mt-2">
                  by {action.profiles?.full_name || 'Unknown Agent'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
