import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { useAuth } from '../app/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'

const features = [
  { icon: '🎯', title: 'Instant ATS Scan', desc: 'Get your ATS compatibility score in seconds. See exactly what keywords you\'re missing.' },
  { icon: '✨', title: 'AI Optimization', desc: 'Claude rewrites your resume to maximize keyword alignment — without fabricating your experience.' },
  { icon: '📝', title: 'Cover Letter Generator', desc: 'Generate a tailored, professional cover letter for any role in under 30 seconds.' },
  { icon: '💼', title: 'LinkedIn Optimization', desc: 'Get an optimized headline and About section that attracts recruiters and passes searches.' },
]

const stats = [
  { value: '96%', label: 'Average ATS score improvement' },
  { value: '3x', label: 'More interview callbacks' },
  { value: '< 30s', label: 'Time to get your score' },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Instant ATS scan', 'Keyword gap analysis', 'Score breakdown', '1 resume scan per session'],
    cta: 'Start Free Scan',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    altPrice: 'or $49 one-time',
    features: ['Everything in Free', 'AI resume optimization', 'Cover letter generator', 'LinkedIn headline + summary', 'Unlimited scans', 'DOCX & PDF downloads'],
    cta: 'Start Pro — $19/mo',
    highlight: true,
  },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const goToApp = () => navigate(user ? '/workspace' : '/signup')

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--charcoal)' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--gray-100)',
        padding: isMobile ? '0 16px' : '0 40px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 60,
      }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isMobile && <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')}>Pricing</Button>}
          <Button variant="outline" size="sm" onClick={() => navigate(user ? '/workspace' : '/login')}>Sign In</Button>
          <Button variant="primary" size="sm" onClick={goToApp}>{isMobile ? 'Start Free' : 'Get Started Free'}</Button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 60%, #1e4d8c 100%)',
        padding: isMobile ? '60px 20px 50px' : '100px 40px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(47,133,90,0.25)', border: '1px solid rgba(47,133,90,0.5)',
            borderRadius: 999, padding: '6px 16px', marginBottom: 24,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald-light)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#68D391', fontSize: 13, fontWeight: 600 }}>Powered by Claude AI</span>
          </div>

          <h1 style={{
            fontSize: isMobile ? '36px' : 'clamp(36px, 6vw, 64px)',
            fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 20,
            letterSpacing: '-0.03em',
          }}>
            Get More Interviews.<br />
            <span style={{ color: '#68D391' }}>Beat the ATS.</span>
          </h1>

          <p style={{ fontSize: isMobile ? 15 : 18, color: 'rgba(255,255,255,0.75)', maxWidth: 540, margin: '0 auto 32px', lineHeight: 1.7 }}>
            AI Resume Studio analyzes your resume against any job description, optimizes it for ATS systems, and generates tailored cover letters — in seconds.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button size="lg" variant="primary" onClick={goToApp}
              style={{ background: 'var(--emerald)', borderColor: 'var(--emerald)', fontSize: isMobile ? 15 : 16, padding: isMobile ? '12px 24px' : '14px 32px' }}>
              Scan My Resume Free →
            </Button>
            {!isMobile && (
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontSize: 16, padding: '14px 32px' }}>
                View Pricing
              </Button>
            )}
          </div>

          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 20 }}>
            No account required · Free ATS scan · Upgrade anytime
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--navy-dark)', padding: isMobile ? '32px 20px' : '40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: isMobile ? 32 : 80, flexWrap: 'wrap' }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, color: 'var(--emerald-light)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: isMobile ? '60px 20px' : '100px 40px', background: 'var(--gray-50)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 60 }}>
            <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em' }}>
              Everything you need to land the interview
            </h2>
            <p style={{ color: 'var(--gray-500)', marginTop: 12, fontSize: 15 }}>
              A complete career intelligence toolkit — not just a resume builder.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {features.map(f => (
              <div key={f.title} style={{
                background: 'white', borderRadius: 'var(--radius-lg)', padding: isMobile ? '24px 20px' : '32px 24px',
                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)',
              }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: isMobile ? '60px 20px' : '100px 40px', background: 'white' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 60 }}>
            <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Simple, transparent pricing</h2>
            <p style={{ color: 'var(--gray-500)', marginTop: 12 }}>Start free. Upgrade when you're ready.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {plans.map(plan => (
              <div key={plan.name} style={{
                borderRadius: 'var(--radius-xl)', padding: isMobile ? '32px 24px' : '40px 32px',
                border: plan.highlight ? '2px solid var(--emerald)' : '2px solid var(--gray-100)',
                background: plan.highlight ? 'var(--navy)' : 'white',
                position: 'relative', boxShadow: plan.highlight ? 'var(--shadow-xl)' : 'var(--shadow-sm)',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--emerald)', color: 'white', fontSize: 12, fontWeight: 700,
                    padding: '4px 16px', borderRadius: 999, whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: plan.highlight ? 'rgba(255,255,255,0.6)' : 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 48, fontWeight: 900, color: plan.highlight ? 'white' : 'var(--navy)', lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 16, color: plan.highlight ? 'rgba(255,255,255,0.6)' : 'var(--gray-400)' }}>{plan.period}</span>
                  </div>
                  {plan.altPrice && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{plan.altPrice}</div>}
                </div>
                <ul style={{ marginBottom: 32 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, fontSize: 14, color: plan.highlight ? 'rgba(255,255,255,0.85)' : 'var(--gray-600)' }}>
                      <span style={{ color: 'var(--emerald-light)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button fullWidth variant={plan.highlight ? 'primary' : 'outline'} onClick={goToApp}
                  style={plan.highlight ? {} : { borderColor: 'var(--navy)', color: 'var(--navy)' }}>
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--emerald-dark), var(--emerald))',
        padding: isMobile ? '60px 20px' : '80px 40px', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: 'white', marginBottom: 16, letterSpacing: '-0.02em' }}>
          Ready to get more interviews?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 28, fontSize: 15 }}>
          Scan your resume for free — no account required.
        </p>
        <Button size="lg" variant="secondary" onClick={goToApp}
          style={{ background: 'white', color: 'var(--emerald)', borderColor: 'white', fontSize: 16, padding: '14px 36px' }}>
          Start Free Scan →
        </Button>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--navy-dark)', padding: '36px 20px', textAlign: 'center' }}>
        <Logo size="sm" variant="light" />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, marginBottom: 12 }}>
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}
            onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
            onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
            Privacy Policy
          </a>
          <a href="/terms" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}
            onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
            onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
            Terms of Service
          </a>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
          © {new Date().getFullYear()} AI Resume Studio. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
