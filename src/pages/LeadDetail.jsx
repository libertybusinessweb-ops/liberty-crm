import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  RiArrowLeftLine, RiSaveLine, RiLoader4Line,
  RiPhoneLine, RiMailLine, RiBuildingLine, RiUserLine,
  RiCalendarLine,
} from 'react-icons/ri'
import { useLead } from '../hooks/useLeads'
import { useActions } from '../hooks/useActions'
import { useDocs } from '../hooks/useDocs'
import LeadStatusBadge, { STATUS_CONFIG } from '../components/LeadStatusBadge'
import ActionTimeline from '../components/ActionTimeline'
import DocumentUploader from '../components/DocumentUploader'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const ACTION_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'email', label: 'Email' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'note', label: 'Note' },
]

const OUTCOMES = [
  { value: 'no_response', label: 'No Response' },
  { value: 'response', label: 'Response' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'sold', label: 'Sold' },
  { value: 'lost', label: 'Lost' },
  { value: 'other', label: 'Other' },
]

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { lead, loading, updateLead } = useLead(id)
  const { actions, loading: actionsLoading, logAction, deleteAction } = useActions(id)
  const { docs, loading: docsLoading, uploading, uploadDoc, deleteDoc } = useDocs(id)

  // Lead form state
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  // Action form state
  const [actionForm, setActionForm] = useState({
    action_type: 'call',
    action_date: new Date().toISOString().slice(0, 16),
    outcome: 'no_response',
    notes: '',
  })
  const [loggingAction, setLoggingAction] = useState(false)

  useEffect(() => {
    if (lead) {
      setForm({
        client_name: lead.client_name || '',
        client_email: lead.client_email || '',
        client_phone: lead.client_phone || '',
        company: lead.company || '',
        source: lead.source || '',
        status: lead.status || 'new',
        interest_area: lead.interest_area || '',
        product_sold: lead.product_sold || '',
        notes: lead.notes || '',
        first_contact_date: lead.first_contact_date ? lead.first_contact_date.slice(0, 10) : '',
        closed_date: lead.closed_date ? lead.closed_date.slice(0, 10) : '',
      })
    }
  }, [lead])

  async function handleSave() {
    setSaving(true)
    const updates = { ...form }
    if (!updates.first_contact_date) delete updates.first_contact_date
    if (!updates.closed_date) delete updates.closed_date
    const { error } = await updateLead(updates)
    setSaving(false)
    if (error) toast.error(`Save failed: ${error.message}`)
    else toast.success('Lead updated')
  }

  async function handleLogAction(e) {
    e.preventDefault()
    setLoggingAction(true)
    const { error } = await logAction({
      ...actionForm,
      action_date: new Date(actionForm.action_date).toISOString(),
    })
    setLoggingAction(false)
    if (error) toast.error(`Failed to log action: ${error.message}`)
    else {
      toast.success('Action logged')
      setActionForm(f => ({
        ...f,
        action_date: new Date().toISOString().slice(0, 16),
        notes: '',
        outcome: 'no_response',
      }))
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-96 rounded-xl" />
          <div className="skeleton h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-secondary">Lead not found.</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">Go Back</button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2">
            <RiArrowLeftLine size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{lead.client_name}</h2>
            <p className="text-sm text-text-muted">{lead.company}</p>
          </div>
          <LeadStatusBadge status={lead.status} size="md" />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <><RiLoader4Line size={16} className="animate-spin" /> Saving...</> : <><RiSaveLine size={16} /> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL — Lead Info */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-bold text-text-primary mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Client Name</label>
                  <input value={form.client_name || ''} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label">Company</label>
                  <input value={form.company || ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label"><RiMailLine className="inline mr-1" size={12} />Email</label>
                  <input type="email" value={form.client_email || ''} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label"><RiPhoneLine className="inline mr-1" size={12} />Phone</label>
                  <input value={form.client_phone || ''} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Source</label>
                  <input value={form.source || ''} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input-field" placeholder="e.g. referral" />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select value={form.status || 'new'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="select-field">
                    {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label"><RiCalendarLine className="inline mr-1" size={12} />First Contact</label>
                  <input type="date" value={form.first_contact_date || ''} onChange={e => setForm(f => ({ ...f, first_contact_date: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label"><RiCalendarLine className="inline mr-1" size={12} />Closed Date</label>
                  <input type="date" value={form.closed_date || ''} onChange={e => setForm(f => ({ ...f, closed_date: e.target.value }))} className="input-field" />
                </div>
              </div>

              <div>
                <label className="label">Assigned Agent</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-bg-elevated rounded-lg border border-border-subtle">
                  <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs text-accent-blue font-bold">
                    {lead.profiles?.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm text-text-secondary">{lead.profiles?.full_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interest & Product */}
          <div className="card">
            <h3 className="text-sm font-bold text-text-primary mb-4">Deal Details</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Interest Area</label>
                <textarea
                  value={form.interest_area || ''}
                  onChange={e => setForm(f => ({ ...f, interest_area: e.target.value }))}
                  className="input-field min-h-[80px] resize-none"
                  placeholder="What is the client interested in?"
                />
              </div>
              {form.status === 'closed_won' && (
                <div>
                  <label className="label">Product Sold</label>
                  <input
                    value={form.product_sold || ''}
                    onChange={e => setForm(f => ({ ...f, product_sold: e.target.value }))}
                    className="input-field"
                    placeholder="What was sold?"
                  />
                </div>
              )}
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={form.notes || ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Internal notes, context, next steps..."
                />
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="card">
            <h3 className="text-sm font-bold text-text-primary mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span className="text-text-muted">Created</span>
                <span>{format(new Date(lead.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span className="text-text-muted">Last Updated</span>
                <span>{format(new Date(lead.updated_at || lead.created_at), 'MMM d, yyyy')}</span>
              </div>
              {lead.first_contact_date && (
                <div className="flex justify-between text-text-secondary">
                  <span className="text-text-muted">First Contact</span>
                  <span>{format(new Date(lead.first_contact_date), 'MMM d, yyyy')}</span>
                </div>
              )}
              {lead.closed_date && (
                <div className="flex justify-between text-text-secondary">
                  <span className="text-text-muted">Closed Date</span>
                  <span>{format(new Date(lead.closed_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Actions */}
        <div className="space-y-4">
          {/* Log Action Form */}
          <div className="card">
            <h3 className="text-sm font-bold text-text-primary mb-4">Log New Action</h3>
            <form onSubmit={handleLogAction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Action Type</label>
                  <select
                    value={actionForm.action_type}
                    onChange={e => setActionForm(f => ({ ...f, action_type: e.target.value }))}
                    className="select-field"
                  >
                    {ACTION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Outcome</label>
                  <select
                    value={actionForm.outcome}
                    onChange={e => setActionForm(f => ({ ...f, outcome: e.target.value }))}
                    className="select-field"
                  >
                    {OUTCOMES.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Date & Time</label>
                <input
                  type="datetime-local"
                  value={actionForm.action_date}
                  onChange={e => setActionForm(f => ({ ...f, action_date: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={actionForm.notes}
                  onChange={e => setActionForm(f => ({ ...f, notes: e.target.value }))}
                  className="input-field min-h-[72px] resize-none"
                  placeholder="What happened? Any follow-up needed?"
                />
              </div>
              <button type="submit" disabled={loggingAction} className="btn-primary w-full justify-center">
                {loggingAction ? <><RiLoader4Line size={16} className="animate-spin" /> Logging...</> : 'Log Action'}
              </button>
            </form>
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="text-sm font-bold text-text-primary mb-4">
              Action History <span className="text-text-muted font-normal">({actions.length})</span>
            </h3>
            <ActionTimeline
              actions={actions}
              loading={actionsLoading}
              onDelete={deleteAction}
            />
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="card">
        <h3 className="text-base font-bold text-text-primary mb-5">
          Documents <span className="text-text-muted font-normal text-sm">({docs.length})</span>
        </h3>
        <DocumentUploader
          docs={docs}
          loading={docsLoading}
          uploading={uploading}
          onUpload={uploadDoc}
          onDelete={deleteDoc}
        />
      </div>
    </div>
  )
}
