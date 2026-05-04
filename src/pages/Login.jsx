import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiEyeLine, RiEyeOffLine, RiLoader4Line } from 'react-icons/ri'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function LibertyIcon() {
  return (
    <svg viewBox="0 0 96 88" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-14">
      <path d="M 48 8 L 18 8 Q 8 8 8 18 L 8 70 Q 8 80 18 80 L 78 80 Q 88 80 88 70 L 88 44"
        stroke="#0071CE" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 48 80 L 78 80 Q 88 80 88 70 L 88 18 Q 88 8 78 8 L 18 8 Q 8 8 8 18 L 8 44"
        stroke="#FF5300" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Login() {
  const { signIn } = useAuth()
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
    navigate('/my-leads')
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(242,90,34,0.04)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(24,118,213,0.05)' }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <LibertyIcon />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1876d5' }}>Liberty Business CRM</h1>
          <p className="text-text-muted mt-1 text-sm">Sign in to your account</p>
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
                  placeholder="â¢â¢â¢â¢â¢â¢â¢â¢"
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-base font-semibold text-white transition-all duration-200 disabled:opacity-60"
              style={{ background: loading ? '#c44a1a' : '#f25a22' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#d94e1c' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#f25a22' }}
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
