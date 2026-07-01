import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { IconMail } from '../features/workspace/shared'

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: '', color: 'transparent' }
  let score = 0
  if (pw.length >= 8)  score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score: 1, label: 'Weak',   color: 'var(--danger)' }
  if (score <= 3) return { score: 2, label: 'Fair',   color: 'var(--warning)' }
  return              { score: 3, label: 'Strong', color: 'var(--success)' }
}

export function SignupPage() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const { error } = await signUp(email, password)
    setLoading(false)
    if (error) {
      setError(error)
    } else {
      setConfirmed(true)
    }
  }

  if (confirmed) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
        <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-xl)', padding: '48px 36px', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--navy)', marginBottom: 16 }}><IconMail /></div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 10 }}>Check your email</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account, then come back and sign in.
          </p>
          <Button variant="outline" style={{ marginTop: 24 }} onClick={() => navigate('/login')}>
            Go to Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
      <div style={{ marginBottom: 32 }}>
        <Logo size="md" />
      </div>

      <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-xl)', padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 6, textAlign: 'center' }}>Create your account</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28 }}>Free to start. Upgrade when you're ready.</p>

        <button
          onClick={() => signInWithGoogle()}
          type="button"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '10px 16px', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', background: 'var(--surface-1)',
            color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or sign up with email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-input)', borderRadius: 'var(--radius)', fontSize: 14, fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-input)', borderRadius: 'var(--radius)', fontSize: 14, fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
            />
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= strength.score ? strength.color : 'var(--surface-2)',
                      transition: 'background 0.2s ease',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: strength.color, margin: 0, fontWeight: 600 }}>
                  {strength.label}
                  {strength.score < 3 && (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                      {' '}— try adding {!(/[A-Z]/.test(password)) ? 'an uppercase letter' : !(/[0-9]/.test(password)) ? 'a number' : 'a symbol'}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" variant="primary" loading={loading} style={{ marginTop: 4 }}>
            Create Account
          </Button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          By creating an account you agree to our{' '}
          <Link to="/terms" style={{ color: 'var(--text-heading)', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" style={{ color: 'var(--text-heading)', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>.
        </p>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--text-heading)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
