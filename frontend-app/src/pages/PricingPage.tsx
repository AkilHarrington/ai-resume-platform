import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { createCheckoutSession } from '../api/resumeApi'
import { useAuth } from '../app/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'

const features = [
  { label: 'ATS scan & score', free: true, pro: true },
  { label: 'Keyword gap analysis', free: true, pro: true },
  { label: 'Score breakdown by category', free: true, pro: true },
  { label: 'Match intelligence report', free: false, pro: true },
  { label: 'AI resume optimization', free: false, pro: true },
  { label: 'Cover letter generator', free: false, pro: true },
  { label: 'LinkedIn headline + summary', free: false, pro: true },
  { label: 'Unlimited resume scans', free: false, pro: true },
  { label: 'DOCX + PDF downloads', free: false, pro: true },
  { label: 'Before/after comparison', free: false, pro: true },
]

export function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [billing, setBilling] = useState<'monthly' | 'onetime'>('monthly')

  const checkoutMutation = useMutation({
    mutationFn: () => createCheckoutSession(billing),
    onSuccess: (data) => { window.location.href = data.url },
    onError: () => alert('Payment system is not configured yet. Add your Stripe keys to the backend .env file.'),
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', fontFamily: 'var(--font-sans)' }}>

      {/* Nav */}
      <nav style={{
        background: 'var(--surface-0)', borderBottom: '1px solid var(--border)',
        padding: isMobile ? '0 16px' : '0 40px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 60,
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Logo size="sm" />
        </button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/workspace')}>Back to App</Button>
      </nav>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: isMobile ? '40px 16px' : '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
          <h1 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 900, color: 'var(--text-heading)', letterSpacing: '-0.03em', marginBottom: 12 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Start free. Upgrade when you're ready to land the interview.
          </p>

          {/* Billing Toggle */}
          <div style={{ display: 'inline-flex', background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 4, gap: 4, marginTop: 24 }}>
            {(['monthly', 'onetime'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)} style={{
                padding: '8px 16px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: billing === b ? 'var(--navy)' : 'transparent',
                color: billing === b ? 'white' : 'var(--gray-500)',
                transition: 'all var(--transition)',
              }}>
                {b === 'monthly' ? 'Monthly' : 'One-Time'}
                {b === 'onetime' && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--emerald)', color: 'white', padding: '2px 6px', borderRadius: 999 }}>BEST VALUE</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Grid — stacks on mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 24, marginBottom: 48,
        }}>
          {/* Free */}
          <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-xl)', padding: isMobile ? '28px 24px' : '36px 32px', border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Free</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-heading)', lineHeight: 1, marginBottom: 6 }}>$0</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>forever</div>
            <Button fullWidth variant="outline" onClick={() => navigate(user ? '/workspace' : '/signup')} style={{ marginBottom: 24, borderColor: 'var(--navy)', color: 'var(--text-heading)' }}>
              Start Free Scan
            </Button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {features.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: f.free ? 1 : 0.35 }}>
                  <span style={{ color: f.free ? 'var(--success)' : 'var(--gray-300)', fontWeight: 700, flexShrink: 0 }}>{f.free ? '✓' : '✗'}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro */}
          <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-xl)', padding: isMobile ? '28px 24px' : '36px 32px', border: '2px solid var(--emerald)', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--emerald)', color: 'white', fontSize: 12, fontWeight: 700,
              padding: '4px 18px', borderRadius: 999, whiteSpace: 'nowrap',
            }}>MOST POPULAR</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: 'white', lineHeight: 1 }}>
                {billing === 'monthly' ? '$19' : '$49'}
              </span>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>
                {billing === 'monthly' ? '/month' : ' one-time'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
              {billing === 'monthly' ? 'Cancel anytime' : 'Lifetime Pro access'}
            </div>
            <Button
              fullWidth variant="primary" loading={checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
              style={{ marginBottom: 24, fontSize: 15, padding: '12px 0' }}
            >
              {billing === 'monthly' ? 'Start Pro — $19/mo' : 'Get Lifetime Pro — $49'}
            </Button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {features.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--emerald-light)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-xl)', padding: isMobile ? '28px 20px' : '40px 32px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 24 }}>Common questions</h2>
          {[
            { q: 'What\'s the difference between monthly and one-time?', a: 'Monthly gives you full access for $19/month, cancel anytime. One-time is a single $49 payment for lifetime Pro access — no recurring charges.' },
            { q: 'Does the free plan require a credit card?', a: 'No credit card required. You\'ll need a free account to get started — sign up takes less than 30 seconds.' },
            { q: 'How does the AI optimization work?', a: 'Claude analyzes your resume against the job description, identifies keyword gaps, and rewrites your content to improve ATS alignment — without fabricating your experience or changing facts.' },
            { q: 'What file formats can I upload?', a: 'PDF, DOCX, and plain text files are all supported.' },
          ].map(({ q, a }) => (
            <div key={q} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
