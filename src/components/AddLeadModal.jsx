import { useState } from 'react'
import { RiCloseLine } from 'react-icons/ri'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const SOURCES = ['referral', 'website', 'cold_outreach', 'social_media', 'event', 'partner', 'other']

export default function AddLeadModal({ onClose, onSave, agents = [] }) {
  const { isAdmin, user, profile } = useAuth()
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    company: '',
    source: 'referral',
    status: 'new',
    interest_area: '',
    notes: '',
    assigned_to: isAdmin ? '' : user?.id,
  })
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.client_name.trim()) {
      toast.error('Client name is required')
      return
    }
    setSaving(true)
    const { error } = await onSave({
      ...form,
      assigned_to: form.assigned_to || user?.id,
    })
    setSaving(false)
    if (error) {
      toast.error(`Failed to create lead: ${error.message}`)
    } else {
      toast.success('Lead created!')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border-subtle rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-bold text-text-primary">Add New Lead</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <RiCloseLine size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Client Name *</label>
              <input name="client_name" value={form.client_name} onChange={handleChange} className="input-field" placeholder="Jane Smith" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="client_email" type="email" value={form.client_email} onChange={handleChange} className="input-field" placeholder="jane@company.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="client_phone" value={form.client_phone} onChange={handleChange} className="input-field" placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="label">Company</label>
              <input name="company" value={form.company} onChange={handleChange} className="input-field" placeholder="Acme Corp" />
            </div>
            <div>
              <label className="label">Source</label>
              <select name="source" value={form.source} onChange={handleChange} className="select-field">
                {SOURCES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            {isAdmin && agents.length > 0 && (
              <div className="col-span-2">
                <label className="label">Assign To</label>
                <select name="assigned_to" value={form.assigned_to} onChange={handleChange} className="select-field">
                  <option value="">Assign to me ({profile?.full_name})</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.full_name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="label">Interest Area</label>
              <input name="interest_area" value={form.interest_area} onChange={handleChange} className="input-field" placeholder="What is the client interested in?" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field min-h-[80px] resize-none" placeholder="Initial context, background info..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
