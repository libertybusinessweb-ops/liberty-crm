import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { RiLoader4Line, RiEyeLine, RiEyeOffLine, RiCheckLine } from 'react-icons/ri'
import toast from 'react-hot-toast'

const LOGO_URL = 'https://www.libertybusinesspr.com/app/uploads/2026/01/logo-lb-rgb-sin-slogan-1.svg'

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const token     = params.get('token')

  const [invite,   setInvite]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)
  const [form, setForm] = useState({ full_name: '', password: '', confirm: '' })
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()
      .then(({ data, error }) => {
        if (error || !data) toast.error('Invitación inválida o expirada')
        else setInvite(data)
        setLoading(false)
      })
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Las contraseñas no coinciden'); return }
    if (form.password.length < 6)       { toast.error('Mínimo 6 caracteres');          return }
    setSubmitting(true)
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    invite.email,
        password: form.password,
        options:  { data: { full_name: form.full_name } },
      })
      if (authError) throw authError

      const uid = authData.user?.id
      if (!uid) throw new Error('No user ID returned')

      // 2. Insert profile with role from invitation
      const { error: profError } = await supabase
        .from('profiles')
        .upsert({
          id:        uid,
          email:     invite.email,
          full_name: form.full_name,
          role:      invite.role,
          is_active: true,
        })
      if (profError) throw profError

      // 3. Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('token', token)

      setDone(true)
      toast.success('¡Cuenta creada! Redirigiendo...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      toast.error(err.message ?? 'Error al crear la cuenta')
    } finally {
      setSubmitting(false)
    }
  }

  const roleLabel = {
    admin: 'Administrador', 'co-admin': 'Co-Admin',
    viewer: 'Viewer', vendedor: 'Vendedor',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <RiLoader4Line className="animate-spin text-accent-blue" size={32} />
      </div>
    )
  }

  if (!token || !invite) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted text-lg">Invitación inválida o expirada.</p>
          <button onClick={() => navigate('/login')} className="mt-4 text-accent-blue underline text-sm">
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl px-6 py-3">
            <img src={LOGO_URL} alt="Liberty Business" className="h-10 w-auto" />
          </div>
        </div>

        <div className="bg-surface border border-border-subtle rounded-2xl p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <RiCheckLine size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-text-base mb-2">¡Listo!</h2>
              <p className="text-text-muted text-sm">Redirigiendo al login...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-text-base">Crear tu cuenta</h1>
                <p className="text-sm text-text-muted mt-1">
                  Fuiste invitado como <span className="text-accent-blue font-medium">{roleLabel[invite.role] ?? invite.role}</span>
                </p>
                <div className="mt-3 px-3 py-2 bg-accent-blue/10 rounded-lg text-sm text-accent-blue">
                  {invite.email}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Nombre completo</label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Tu nombre"
                    className="w-full px-3 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-base placeholder-text-muted text-sm focus:outline-none focus:border-accent-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-base placeholder-text-muted text-sm focus:outline-none focus:border-accent-blue pr-10"
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base">
                      {showPwd ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Confirmar contraseña</label>
                  <input
                    type="password"
                    required
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Repite tu contraseña"
                    className="w-full px-3 py-2.5 bg-bg-base border border-border-subtle rounded-xl text-text-base placeholder-text-muted text-sm focus:outline-none focus:border-accent-blue"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {submitting && <RiLoader4Line className="animate-spin" size={16} />}
                  Crear cuenta
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
