import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useActions(leadId) {
  const { user } = useAuth()
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchActions = useCallback(async () => {
    if (!leadId) return
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('lead_actions')
        .select(`
          *,
          profiles!lead_actions_agent_id_fkey(id, full_name, avatar_url)
        `)
        .eq('lead_id', leadId)
        .order('action_date', { ascending: false })

      if (fetchError) throw fetchError
      setActions(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => { fetchActions() }, [fetchActions])

  async function logAction(actionData) {
    const { data, error } = await supabase
      .from('lead_actions')
      .insert([{
        ...actionData,
        lead_id: leadId,
        agent_id: user?.id,
      }])
      .select(`
        *,
        profiles!lead_actions_agent_id_fkey(id, full_name, avatar_url)
      `)
      .single()

    if (!error) {
      setActions(prev => [data, ...prev])
      // Update lead's updated_at
      await supabase
        .from('leads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', leadId)
    }
    return { data, error }
  }

  async function deleteAction(actionId) {
    const { error } = await supabase
      .from('lead_actions')
      .delete()
      .eq('id', actionId)
    if (!error) setActions(prev => prev.filter(a => a.id !== actionId))
    return { error }
  }

  return { actions, loading, error, refetch: fetchActions, logAction, deleteAction }
}

export function useRecentActivity(limit = 10) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('lead_actions')
        .select(`
          *,
          leads(id, client_name, company),
          profiles!lead_actions_agent_id_fkey(id, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      setActivities(data || [])
      setLoading(false)
    }
    fetch()
  }, [limit])

  return { activities, loading }
}
