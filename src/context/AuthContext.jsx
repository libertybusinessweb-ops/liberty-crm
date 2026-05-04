import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const role = profile?.role ?? null
  const isAdmin    = role === 'admin'
  const isCoAdmin  = role === 'co-admin'
  const isViewer   = role === 'viewer'
  const isVendedor = role === 'vendedor'
  // backward compat
  const isAgent    = isVendedor || role === 'agent'

  const canManageLeads = ['admin', 'co-admin'].includes(role)
  const canImport      = ['admin', 'co-admin'].includes(role)
  const canViewAll     = ['admin', 'co-admin', 'viewer'].includes(role)
  const canInvite      = ['admin', 'co-admin'].includes(role)

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      role,
      isAdmin,
      isCoAdmin,
      isViewer,
      isVendedor,
      isAgent,
      canManageLeads,
      canImport,
      canViewAll,
      canInvite,
      signIn,
      signOut,
      refreshProfile: () => user && fetchProfile(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
