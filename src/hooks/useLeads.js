import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useLeads(filters = {}) {
  const { isAdmin, user } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          profiles!leads_assigned_to_fkey(id, full_name, email, avatar_url),
          lead_actions(id, action_type, action_date, outcome, notes, created_at,
            profiles!lead_actions_agent_id_fkey(full_name))
        `)
        .order('created_at', { ascending: false })

      // Agents only see their own leads (RLS also enforces this)
      if (!isAdmin) {
        query = query.eq('assigned_to', user?.id)
      }

      // Apply filters
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
      if (filters.source) query = query.eq('source', filters.source)
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo)
      if (filters.search) {
        query = query.or(`client_name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,client_email.ilike.%${filters.search}%`)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setLeads(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, user?.id, JSON.stringify(filters)])

  useEffect(() => {
    if (user) fetchLeads()
  }, [fetchLeads, user])

  async function createLead(leadData) {
    const { data, error } = await supabase
      .from('leads')
      .insert([{ ...leadData, assigned_to: leadData.assigned_to || user?.id }])
      .select()
      .single()
    if (!error) fetchLeads()
    return { data, error }
  }

  async function updateLead(id, updates) {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error) fetchLeads()
    return { data, error }
  }

  async function deleteLead(id) {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (!error) fetchLeads()
    return { error }
  }

  async function bulkUpdateStatus(ids, status) {
    const { error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
    if (!error) fetchLeads()
    return { error }
  }

  return { leads, loading, error, refetch: fetchLeads, createLead, updateLead, deleteLead, bulkUpdateStatus }
}

export function useLead(id) {
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLead = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select(`
          *,
          profiles!leads_assigned_to_fkey(id, full_name, email, avatar_url)
        `)
        .eq('id', id)
        .single()
      if (fetchError) throw fetchError
      setLead(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchLead() }, [fetchLead])

  async function updateLead(updates) {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error) setLead(data)
    return { data, error }
  }

  return { lead, loading, error, refetch: fetchLead, updateLead }
}
