import { useRef, useState } from 'react'
import { format } from 'date-fns'
import {
  RiUploadCloud2Line, RiFileLine, RiDeleteBinLine,
  RiDownloadLine, RiFileTextLine, RiLoader4Line,
} from 'react-icons/ri'
import toast from 'react-hot-toast'

const DOC_TYPES = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'contract', label: 'Contract' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'other', label: 'Other' },
]

const DOC_TYPE_COLORS = {
  proposal: 'text-blue-400 bg-blue-400/10',
  contract: 'text-emerald-400 bg-emerald-400/10',
  presentation: 'text-purple-400 bg-purple-400/10',
  other: 'text-slate-400 bg-slate-400/10',
}

export default function DocumentUploader({ docs, loading, uploading, onUpload, onDelete }) {
  const fileInputRef = useRef(null)
  const [docType, setDocType] = useState('proposal')
  const [dragOver, setDragOver] = useState(false)

  async function handleFileSelect(file) {
    if (!file) return
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File too large. Max size is 10MB')
      return
    }
    const { error } = await onUpload(file, docType)
    if (error) toast.error(`Upload failed: ${error.message}`)
    else toast.success('Document uploaded')
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  async function handleDelete(docId, storagePath, fileName) {
    if (!confirm(`Delete "${fileName}"?`)) return
    const { error } = await onDelete(docId, storagePath)
    if (error) toast.error('Failed to delete document')
    else toast.success('Document deleted')
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">Document Type</label>
          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            className="select-field"
          >
            {DOC_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-primary"
        >
          {uploading ? (
            <><RiLoader4Line size={16} className="animate-spin" /> Uploading...</>
          ) : (
            <><RiUploadCloud2Line size={16} /> Upload File</>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={e => handleFileSelect(e.target.files[0])}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-accent-blue bg-accent-blue/5' : 'border-border-subtle hover:border-border-DEFAULT'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <RiUploadCloud2Line size={24} className="mx-auto text-text-muted mb-2" />
        <p className="text-sm text-text-secondary">Drop files here or <span className="text-accent-blue">browse</span></p>
        <p className="text-xs text-text-muted mt-1">PDF, Word, Excel, PowerPoint, Images — max 10MB</p>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8">
          <RiFileLine size={28} className="mx-auto text-text-muted mb-2" />
          <p className="text-text-muted text-sm">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border border-border-subtle group hover:border-border-DEFAULT transition-colors"
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${DOC_TYPE_COLORS[doc.doc_type] || DOC_TYPE_COLORS.other}`}>
                <RiFileTextLine size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{doc.file_name}</p>
                <p className="text-xs text-text-muted">
                  {doc.doc_type.charAt(0).toUpperCase() + doc.doc_type.slice(1)} ·{' '}
                  {doc.profiles?.full_name} · {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="p-1.5 text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors"
                  title="Download"
                >
                  <RiDownloadLine size={16} />
                </a>
                <button
                  onClick={() => handleDelete(doc.id, doc.storage_path, doc.file_name)}
                  className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <RiDeleteBinLine size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
