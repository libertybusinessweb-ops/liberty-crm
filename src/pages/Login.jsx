import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiBriefcaseLine, RiEyeLine, RiEyeOffLine, RiLoader4Line } from 'react-icons/ri'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { signIn, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signInError } = await signIn(email, password)
    setLoading(false)

    if (signInError) {
      setError('Invalid email or password. Please try again.')
      return
    }

    toast.success('Welcome back!')
    // Navigation handled by App.jsx auth check — but for speed:
    navigate('/my-leads')
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-blue mb-4 shadow-lg shadow-accent-blue/30">
            <RiBriefcaseLine size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Liberty CRM</h1>
          <p className="text-text-muted mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-bg-card border border-border-subtle rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="agent@liberty.com"
                className="input-field"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 text-base font-semibold"
            >
              {loading ? (
                <><RiLoader4Line size={18} className="animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-6">
            Access is managed by your administrator.
            <br />Contact your admin if you need an account.
          </p>
        </div>
      </div>
    </div>
  )
}
