import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useDocs(leadId) {
  const { user } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDocs = useCallback(async () => {
    if (!leadId) return
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('lead_documents')
        .select(`
          *,
          profiles!lead_documents_uploaded_by_fkey(id, full_name)
        `)
        .eq('lead_id', leadId)
        .order('uploaded_at', { ascending: false })

      if (fetchError) throw fetchError
      setDocs(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  async function uploadDoc(file, docType) {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `leads/${leadId}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('lead-documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('lead-documents')
        .getPublicUrl(filePath)

      // Save record to DB
      const { data, error: dbError } = await supabase
        .from('lead_documents')
        .insert([{
          lead_id: leadId,
          uploaded_by: user?.id,
          file_name: file.name,
          file_url: publicUrl,
          doc_type: docType,
          storage_path: filePath,
        }])
        .select(`
          *,
          profiles!lead_documents_uploaded_by_fkey(id, full_name)
        `)
        .single()

      if (dbError) throw dbError
      setDocs(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    } finally {
      setUploading(false)
    }
  }

  async function deleteDoc(docId, storagePath) {
    try {
      // Delete from storage
      if (storagePath) {
        await supabase.storage.from('lead-documents').remove([storagePath])
      }
      // Delete DB record
      const { error } = await supabase
        .from('lead_documents')
        .delete()
        .eq('id', docId)
      if (!error) setDocs(prev => prev.filter(d => d.id !== docId))
      return { error }
    } catch (err) {
      return { error: err }
    }
  }

  return { docs, loading, uploading, error, refetch: fetchDocs, uploadDoc, deleteDoc }
}
