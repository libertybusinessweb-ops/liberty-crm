import { useState } from 'react'
import {
  RiUploadCloudLine, RiFileExcelLine, RiCloseLine,
  RiCheckLine, RiAlertLine, RiArrowLeftLine,
} from 'react-icons/ri'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

// Status mapping: Excel value → CRM status key
const STATUS_MAP = {
  'interesado': 'interested',
  'sin trabajar': 'new',
  'dead lead': 'closed_lost',
  'nuevo': 'new',
  'new': 'new',
  'contacted': 'contacted',
  'contactado': 'contacted',
  'propuesta': 'proposal_sent',
  'proposal sent': 'proposal_sent',
  'ganado': 'closed_won',
  'closed won': 'closed_won',
  'perdido': 'closed_lost',
  'closed lost': 'closed_lost',
  'no interesado': 'not_interested',
  'not interested': 'not_interested',
}

const STATUS_LABELS = {
  interested: 'Interesado',
  new: 'Sin trabajar',
  closed_lost: 'Dead Lead',
  contacted: 'Contactado',
  proposal_sent: 'Propuesta enviada',
  closed_won: 'Cerrado ganado',
  not_interested: 'No interesado',
}

// Detect which header matches a set of patterns (case-insensitive substring match)
function detectColumn(headers, patterns) {
  const lower = headers.map(h => h?.toString().toLowerCase().trim())
  for (const p of patterns) {
    const i = lower.findIndex(h => h?.includes(p))
    if (i !== -1) return headers[i]
  }
  return null
}

export default function ImportLeads() {
  const { user } = useAuth()
  const [step, setStep] = useState('upload') // upload | preview | done
  const [file, setFile] = useState(null)
  const [rawRows, setRawRows] = useState([])
  const [colMap, setColMap] = useState({})
  const [agents, setAgents] = useState([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState({ success: 0, failed: 0 })
  const [dragging, setDragging] = useState(false)

  async function fetchAgents() {
    const { data } = await supabase.from('profiles').select('id, full_name, email')
    return data || []
  }

  function parseFile(f) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

        if (rows.length < 2) {
          toast.error('El archivo parece estar vacío.')
          return
        }

        const hdrs = rows[0].map(h => h?.toString().trim()).filter(Boolean)
        const detected = {
          client_name: detectColumn(hdrs, ['nombre', 'name', 'cliente', 'lead', 'prospecto']),
          client_email: detectColumn(hdrs, ['email', 'correo', 'mail', 'e-mail']),
          client_phone: detectColumn(hdrs, ['telefono', 'teléfono', 'phone', 'tel', 'celular', 'movil', 'móvil']),
          assigned_to: detectColumn(hdrs, ['vendedor', 'agente', 'agent', 'assigned', 'asignado', 'rep']),
          status: detectColumn(hdrs, ['status', 'estado', 'estatus']),
          company: detectColumn(hdrs, ['empresa', 'company', 'compania', 'compañia', 'negocio']),
          interest_area: detectColumn(hdrs, ['producto', 'servicio', 'product', 'service', 'interes', 'interés', 'interest', 'area']),
          notes: detectColumn(hdrs, ['notas', 'notes', 'comentario', 'comments', 'observacion', 'obs']),
        }
        setColMap(detected)

        const dataRows = rows.slice(1)
          .filter(r => r.some(c => c !== null && c !== undefined && c !== ''))
          .map(row => {
            const obj = {}
            hdrs.forEach((h, i) => { obj[h] = row[i] })
            return obj
          })

        setRawRows(dataRows)

        const agentsData = await fetchAgents()
        setAgents(agentsData)
        setStep('preview')
      } catch (err) {
        toast.error('Error leyendo el archivo: ' + err.mes3age)
      }
    }
    reader.readAsArrayBuffer(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f)
      parseFile(f)
    } else {
      toast.error('Por favor sube un archivo Excel (.xlsx o .xls)')
    }
  }

  function handleFileInput(e) {
    const f = e.target.files[0]
    if (f) { setFile(f); parseFile(f) }
  }

  function matchAgent(nameInExcel) {
    if (!nameInExcel) return null
    const q = nameInExcel.toString().toLowerCase().trim()
    return agents.find(a =>
      a.full_name?.toLowerCase().trim() === q ||
      a.full_name?.toLowerCase().includes(q) ||
      q.includes(a.full_name?.toLowerCase().trim())
    ) || null
  }

  function mapStatus(val) {
    if (!val) return 'new'
    return STATUS_MAP[val.toString().toLowerCase().trim()] || 'new'
  }

  function parseRow(row) {
    const get = (key) => colMap[key] ? row[colMap[key]]?.toString().trim() || '' : ''
    return {
      client_name: get('client_name'),
      client_email: get('client_email'),
      client_phone: get('client_phone'),
      company: get('company'),
      interest_area: get('interest_area'),
      notes: get('notes'),
      _vendorName: get('assigned_to'),
      _statusRaw: get('status'),
    }
  }

  const parsedRows = rawRows
    .map(row => {
      const p = parseRow(row)
      return { ...p, agent: matchAgent(p._vendorName), status: mapStatus(p._statusRaw) }
    })
    .filter(r => r.client_name)

  const unmatchedVendors = [...new Set(
    parsedRows.filter(r => r._vendorName && !r.agent).map(r => r._vendorName)
  )]

  async function handleImport() {
    setImporting(true)
    let success = 0
    let failed = 0

    const leads = parsedRows.map(r => ({
      client_name: r.client_name,
      client_email: r.client_email || null,
      client_phone: r.client_phone || null,
      company: r.company || null,
      interest_area: r.interest_area || null,
      notes: r.notes || null,
      status: r.status,
      source: 'other',
      assigned_to: r.agent?.id || user.id,
    }))

    // Batch insert in chunks of 100
    for (let i = 0; i < leads.length; i += 100) {
      const { error } = await supabase.from('leads').insert(leads.slice(i, i + 100))
      if (error) { failed += Math.min(100, leads.length - i) }
      else { success += Math.min(100, leads.length - i) }
    }

    setResults({ success, failed })
    setImporting(false)
    setStep('done')
    if (success > 0) toast.success(`${success} leads importados`)
    if (failed > 0) toast.error(`${failed} leads con error`)
  }

  function reset() {
    setStep('upload'); setFile(null); setRawRows([]); setColMap({}); setAgents([])
  }

  // ── STEP: UPLOAD ──────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Importar Leads</h1>
        <p className="text-text-muted text-sm mb-6">Sube un archivo Excel para importar leads automáticamente al CRM</p>

        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => document.getElementById('excel-file-input').click()}
          className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${
            dragging ? 'border-accent-blue bg-accent-blue/5' : 'border-border-subtle hover:border-border'
          }`}
        >
          <RiUploadCloudLine size={52} className={`mx-auto mb-4 ${dragging ? 'text-accent-blue' : 'text-text-muted'}`} />
          <p className="text-text-primary font-semibold mb-1">Arrastra tu archivo Excel aquí</p>
          <p className="text-text-muted text-sm">o haz clic para seleccionarlo</p>
          <p className="text-text-muted text-xs mt-3">Acepta .xlsx y .xls</p>
          <input id="excel-file-input" type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileInput} />
        </div>

        <div className="mt-6 card">
          <p className="text-sm font-semibold text-text-primary mb-3">Columnas que reconoce el sistema</p>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            {[
              ['Nombre del lead', 'nombre, cliente, lead, prospecto'],
              ['Email', 'email, correo, mail'],
              ['Teléfono', 'telefono, tel, celular, movil'],
              ['Vendedor', 'vendedor, agente, assigned, rep'],
              ['Status', 'status, estado, estatus'],
              ['Empresa', 'empresa, company'],
            ].map(([label, vals]) => (
              <div key={label}>
                <span className="text-text-muted">{label}: </span>
                <span className="text-text-secondary">{vals}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border-subtle">
            <p className="text-xs font-semibold text-text-muted mb-2">Valores de status reconocidos:</p>
            <div className="flex flex-wrap gap-1.5">
              {['interesado', 'sin trabajar', 'dead lead', 'contactado', 'propuesta', 'ganado', 'perdido'].map(s => (
                <span key={s} className="text-xs bg-bg-elevated border border-border-subtle text-text-secondary px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: PREVIEW ─────────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={reset} className="btn-ghost p-2"><RiArrowLeftLine size={18} /></button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Vista Previa · {parsedRows.length} leads</h1>
              <p className="text-text-muted text-xs flex items-center gap-1 mt-0.5">
                <RiFileExcelLine className="text-green-400" size={14} /> {file?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="btn-secondary"><RiCloseLine size={16} />Cancelar</button>
            <button
              onClick={handleImport}
              disabled={importing || parsedRows.length === 0}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
              style={{ background: '#f25a22' }}
            >
              {importing ? 'Importando...' : `Importar ${parsedRows.length} leads`}
            </button>
          </div>
        </div>

        {unmatchedVendors.length > 0 && (
          <div className="mb-4 bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-4 py-3 flex gap-3">
            <RiAlertLine className="text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-yellow-300 text-sm font-medium">Vendedores no encontrados en el sistema</p>
              <p className="text-yellow-400/70 text-xs mt-0.5">
                Se asignarán a tu perfil: <strong>{unmatchedVendors.join(', ')}</strong>
              </p>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-elevated border-b border-border-subtle">
                <tr>
                  <th className="table-header">#</th>
                  <th className="table-header">Nombre</th>
                  <th className="table-header">Email / Teléfono</th>
                  <th className="table-header">Vendedor</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {parsedRows.slice(0, 100).map((row, i) => (
                  <tr key={i} className="hover:bg-bg-elevated/40 transition-colors">
                    <td className="table-cell text-text-muted">{i + 1}</td>
                    <td className="table-cell font-medium">{row.client_name}</td>
                    <td className="table-cell text-text-secondary">
                      <div>{row.client_email || <span className="text-text-muted text-xs">—</span>}</div>
                      {row.client_phone && <div className="text-xs text-text-muted">{row.client_phone}</div>}
                    </td>
                    <td className="table-cell">
                      {row.agent ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-sm">
                          <RiCheckLine size={13} />{row.agent.full_name}
                        </span>
                      ) : row._vendorName ? (
                        <span className="text-yellow-400 text-xs">{row._vendorName} (no encontrado)</span>
                      ) : (
                        <span className="text-text-muted text-xs">Sin asignar</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated border border-border-subtle text-text-secondary">
                        {STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedRows.length > 100 && (
              <p className="text-center text-text-muted text-xs py-3 border-t border-border-subtle">
                Mostrando 100 de {parsedRows.length} leads
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: DONE ────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="card text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <RiCheckLine size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Importación completada</h2>
        <p className="text-text-muted text-sm mb-1">
          <span className="text-emerald-400 font-semibold">{results.success}</span> leads importados exitosamente
        </p>
        {results.failed > 0 && (
          <p className="text-red-400 text-sm mb-1">{results.failed} leads con error</p>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={reset} className="btn-secondary">Importar otro archivo</button>
          <button
            onClick={() => window.location.href = '/leads'}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#f25a22' }}
          >
            Ver todos los leads
          </button>
        </div>
      </div>
    </div>
  )
}
