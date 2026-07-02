import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuth } from '../app/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../app/ThemeContext'
import { IconSun, IconMoon } from '../features/workspace/shared'

// ─── Data ────────────────────────────────────────────────────────────────────

const steps = [
  {
    num: '01',
    title: 'Upload your resume',
    desc: 'Paste or upload your current resume — PDF supported. We parse it instantly.',
  },
  {
    num: '02',
    title: 'Paste a job description',
    desc: 'Drop in any JD. Claude scores you across 6 ATS dimensions and shows exactly what\'s missing.',
  },
  {
    num: '03',
    title: 'Optimize and apply',
    desc: 'AI rewrites your resume for maximum fit. Download as PDF and apply — in under 5 minutes.',
  },
]

const featureList = [
  {
    num: '01',
    title: 'Instant ATS Scan',
    tag: 'Free',
    desc: 'Get scored across 6 dimensions — Keyword Alignment, Experience, Skills, Education, Readability, and Format. See your exact gaps before you apply.',
  },
  {
    num: '02',
    title: 'AI Resume Optimization',
    tag: 'Pro',
    desc: 'Claude rewrites your bullet points, summary, and skills section to match the job description — without inventing experience you don\'t have.',
  },
  {
    num: '03',
    title: 'Cover Letter Generator',
    tag: 'Pro',
    desc: 'One click. A tailored, human-sounding cover letter that matches the tone and requirements of the specific role. No hollow openers.',
  },
  {
    num: '04',
    title: 'LinkedIn Optimization',
    tag: 'Pro',
    desc: 'Get an optimized headline and About section written specifically to attract recruiters searching for your target role.',
  },
]

const testimonials = [
  {
    initials: 'MT',
    name: 'Marcus T.',
    role: 'Software Engineer',
    text: 'My ATS score jumped from 52 to 87 after the optimization. Got 3 callbacks the following week.',
  },
  {
    initials: 'PS',
    name: 'Priya S.',
    role: 'Product Manager',
    text: 'The cover letter generator is ridiculous — saved me 2 hours per application. Sounds like me, not a bot.',
  },
  {
    initials: 'JL',
    name: 'Jordan L.',
    role: 'Marketing Director',
    text: 'Finally understand why my resume was getting ghosted. The keyword gap analysis is eye-opening.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    altPrice: null,
    features: ['Instant ATS scan', 'Keyword gap analysis', 'Score breakdown', '1 resume scan per session'],
    cta: 'Start Free Scan',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    altPrice: 'or $49 one-time',
    features: ['Everything in Free', 'AI resume optimization', 'Cover letter generator', 'LinkedIn headline + summary', 'Unlimited scans', 'PDF downloads'],
    cta: 'Start Pro — $19/mo',
    highlight: true,
  },
]

const faqs = [
  {
    q: 'Is my resume data private?',
    a: 'Yes. Your resume is sent to Claude for analysis only during the session. We do not store your resume text or sell your data.',
  },
  {
    q: "What's the difference between Free and Pro?",
    a: 'Free gives you a full ATS scan and score breakdown. Pro unlocks AI optimization, cover letter generation, LinkedIn optimization, and PDF downloads.',
  },
  {
    q: 'Does the AI make up experience?',
    a: 'Never. The optimizer is explicitly instructed to preserve your voice and facts. It improves phrasing and keyword alignment — not fabricate achievements.',
  },
  {
    q: 'How is this different from a resume builder?',
    a: 'We don\'t build resumes from scratch — we optimize your existing resume against specific job descriptions. Think of it as coaching, not templates.',
  },
  {
    q: 'Can I use it for multiple jobs?',
    a: 'Yes. Pro users get unlimited scans and optimizations. Each job description gets a fresh, tailored version of your resume.',
  },
]

const scoreBreakdown = [
  { label: 'Keyword Alignment', pct: 88 },
  { label: 'Work Experience', pct: 92 },
  { label: 'Education Match', pct: 90 },
  { label: 'Human Readability', pct: 85 },
  { label: 'Format Quality', pct: 78 },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const { theme, toggleTheme } = useTheme()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const goToApp = () => navigate(user ? '/workspace' : '/signup')

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--nav-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: isMobile ? '0 16px' : '0 40px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64,
      }}>
        <Logo size="sm" linkToHome={false} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isMobile && (
            <>
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
                  padding: '6px 12px', borderRadius: 'var(--radius)',
                  transition: 'color var(--transition)',
                }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseOut={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                Pricing
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
                  padding: '6px 14px', borderRadius: 'var(--radius)',
                  transition: 'all var(--transition)',
                }}
                onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-muted)' }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                Sign In
              </button>
            </>
          )}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '7px 9px',
              cursor: 'pointer', lineHeight: 1, transition: 'all var(--transition)',
              display: 'flex', alignItems: 'center',
            }}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <button
            onClick={goToApp}
            style={{
              background: 'var(--navy)', color: 'white', border: 'none',
              borderRadius: 'var(--radius)', padding: isMobile ? '8px 14px' : '8px 18px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'background var(--transition)',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--navy-light)')}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--navy)')}>
            {isMobile ? 'Start Free' : 'Get Started Free'}
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(150deg, #0F2040 0%, #1A365D 55%, #1c4a8a 100%)',
        padding: isMobile ? '56px 20px 48px' : '88px 40px 72px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }} />
        {/* Glow */}
        <div style={{
          position: 'absolute', top: -120, right: -80, width: 480, height: 480,
          background: 'radial-gradient(circle, rgba(47,133,90,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 56,
          flexDirection: isMobile ? 'column' : 'row',
        }}>

          {/* Left: copy */}
          <div style={{ flex: '1 1 460px', minWidth: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(47,133,90,0.18)', border: '1px solid rgba(47,133,90,0.4)',
              borderRadius: 999, padding: '5px 14px', marginBottom: 24,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#68D391', display: 'inline-block',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ color: '#68D391', fontSize: 13, fontWeight: 600 }}>Powered by Claude AI</span>
            </div>

            <h1 style={{
              fontSize: isMobile ? 36 : 'clamp(40px, 5vw, 58px)',
              fontWeight: 900, color: 'white', lineHeight: 1.1,
              marginBottom: 18, letterSpacing: '-0.03em',
            }}>
              Your Resume,<br />
              <span style={{ color: '#68D391' }}>Optimized for Every Job.</span>
            </h1>

            <p style={{
              fontSize: isMobile ? 15 : 17,
              color: 'rgba(255,255,255,0.7)',
              maxWidth: 480, lineHeight: 1.75, marginBottom: 32,
            }}>
              Upload your resume, paste a job description, and Claude scores you across 6 ATS dimensions — then rewrites your resume to maximize your chances of getting through.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={goToApp}
                style={{
                  background: 'var(--emerald)', color: 'white', border: 'none',
                  borderRadius: 'var(--radius)', padding: isMobile ? '13px 24px' : '14px 30px',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all var(--transition)',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--emerald-light)')}
                onMouseOut={e => (e.currentTarget.style.background = 'var(--emerald)')}>
                Scan My Resume Free →
              </button>
              {!isMobile && (
                <button
                  onClick={() => navigate('/pricing')}
                  style={{
                    background: 'transparent', color: 'rgba(255,255,255,0.82)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 'var(--radius)', padding: '14px 28px',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all var(--transition)',
                  }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)')}>
                  View Pricing
                </button>
              )}
            </div>

            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 18 }}>
              Free ATS scan · No credit card required
            </p>
          </div>

          {/* Right: ATS score mockup */}
          {!isMobile && (
            <div style={{ flex: '0 0 320px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.055)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '28px 24px',
                boxShadow: '0 28px 64px rgba(0,0,0,0.45)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ATS Scan Results</span>
                  <span style={{
                    background: 'rgba(104,211,145,0.18)', color: '#68D391',
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                    border: '1px solid rgba(104,211,145,0.3)',
                  }}>STRONG MATCH</span>
                </div>

                <div style={{ textAlign: 'center', padding: '12px 0 24px' }}>
                  <div style={{ fontSize: 76, fontWeight: 900, color: '#68D391', lineHeight: 1 }}>87</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>out of 100</div>
                </div>

                {scoreBreakdown.map(d => (
                  <div key={d.label} style={{ marginBottom: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 12 }}>{d.label}</span>
                      <span style={{ color: '#68D391', fontSize: 12, fontWeight: 700 }}>{d.pct}%</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
                      <div style={{
                        height: '100%',
                        width: `${d.pct}%`,
                        background: 'linear-gradient(90deg, #2F855A, #68D391)',
                        borderRadius: 999,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--surface-0)',
        borderBottom: '1px solid var(--border)',
        padding: '18px 24px',
      }}>
        <div style={{
          maxWidth: 960, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: isMobile ? 20 : 48, flexWrap: 'wrap',
        }}>
          <span style={{
            color: 'var(--text-muted)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>Users landing jobs at</span>
          {['Google', 'Amazon', 'Microsoft', 'Deloitte', 'Goldman Sachs'].map(co => (
            <span key={co} style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 700 }}>{co}</span>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '100px 40px', background: 'var(--surface-page)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
            <p style={{ color: 'var(--emerald)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              How it works
            </p>
            <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              From upload to interview-ready in minutes
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
            {steps.map(s => (
              <div key={s.num} style={{
                background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
                padding: '32px 28px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: 'var(--border)', lineHeight: 1, marginBottom: 20 }}>{s.num}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '100px 40px', background: 'var(--surface-0)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
            <p style={{ color: 'var(--emerald)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Features
            </p>
            <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              A complete career intelligence toolkit
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 15, maxWidth: 480, margin: '12px auto 0' }}>
              Not just a resume builder — a strategic advantage for every application you submit.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
            {featureList.map(f => (
              <div key={f.num} style={{
                background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)',
                padding: '28px 24px', border: '1px solid var(--border)',
                display: 'flex', gap: 20, alignItems: 'flex-start',
              }}>
                <div style={{
                  fontSize: 36, fontWeight: 900, color: 'var(--border)',
                  lineHeight: 1, flexShrink: 0, minWidth: 44,
                }}>{f.num}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>{f.title}</h3>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: f.tag === 'Pro' ? 'rgba(47,133,90,0.1)' : 'rgba(26,54,93,0.08)',
                      color: f.tag === 'Pro' ? 'var(--emerald)' : 'var(--navy)',
                      border: `1px solid ${f.tag === 'Pro' ? 'rgba(47,133,90,0.22)' : 'rgba(26,54,93,0.18)'}`,
                    }}>{f.tag}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '100px 40px', background: 'var(--surface-page)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
            <p style={{ color: 'var(--emerald)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Results
            </p>
            <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              From scan to callback
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
            {testimonials.map(t => (
              <div key={t.name} style={{
                background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
                padding: '28px 24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} style={{ color: '#F59E0B', fontSize: 14 }}>★</span>
                  ))}
                </div>
                <p style={{
                  fontSize: 14, color: 'var(--text-secondary)',
                  lineHeight: 1.7, marginBottom: 20, flex: 1,
                }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--navy)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: isMobile ? '64px 20px' : '100px 40px', background: 'var(--surface-0)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 60 }}>
            <p style={{ color: 'var(--emerald)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Pricing
            </p>
            <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Simple, transparent pricing
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Start free. Upgrade when you're ready.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 20 }}>
            {plans.map(plan => (
              <div key={plan.name} style={{
                borderRadius: 'var(--radius-xl)', padding: isMobile ? '32px 24px' : '40px 32px',
                border: plan.highlight ? '2px solid var(--emerald)' : '2px solid var(--border)',
                background: plan.highlight ? 'var(--navy-dark)' : 'var(--surface-1)',
                position: 'relative',
                boxShadow: plan.highlight ? 'var(--shadow-xl)' : 'none',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--emerald)', color: 'white',
                    fontSize: 11, fontWeight: 700,
                    padding: '4px 16px', borderRadius: 999, letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>MOST POPULAR</div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: plan.highlight ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)',
                    marginBottom: 12,
                  }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, color: plan.highlight ? 'white' : 'var(--text-heading)' }}>{plan.price}</span>
                    <span style={{ fontSize: 15, color: plan.highlight ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>{plan.period}</span>
                  </div>
                  {plan.altPrice && (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 6 }}>{plan.altPrice}</div>
                  )}
                </div>
                <ul style={{ marginBottom: 32, listStyle: 'none', padding: 0 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      marginBottom: 12, fontSize: 14,
                      color: plan.highlight ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                    }}>
                      <span style={{ color: 'var(--emerald-light)', fontWeight: 700, flexShrink: 0, fontSize: 15 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={goToApp}
                  style={{
                    width: '100%',
                    background: plan.highlight ? 'var(--emerald)' : 'transparent',
                    color: plan.highlight ? 'white' : 'var(--text-heading)',
                    border: plan.highlight ? 'none' : '2px solid var(--navy)',
                    borderRadius: 'var(--radius)', padding: '13px',
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    transition: 'all var(--transition)',
                  }}
                  onMouseOver={e => {
                    if (plan.highlight) e.currentTarget.style.background = 'var(--emerald-light)'
                    else e.currentTarget.style.background = 'rgba(26,54,93,0.06)'
                  }}
                  onMouseOut={e => {
                    if (plan.highlight) e.currentTarget.style.background = 'var(--emerald)'
                    else e.currentTarget.style.background = 'transparent'
                  }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '100px 40px', background: 'var(--surface-page)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
            <p style={{ color: 'var(--emerald)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              FAQ
            </p>
            <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Common questions
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{
                background: 'var(--surface-0)', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', overflow: 'hidden',
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '18px 20px', textAlign: 'left', gap: 16,
                  }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{faq.q}</span>
                  <span style={{
                    color: 'var(--text-muted)', fontSize: 22, lineHeight: 1, flexShrink: 0,
                    transform: openFaq === i ? 'rotate(45deg)' : 'none',
                    transition: 'transform 0.2s ease',
                    display: 'inline-block',
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 20px' }}>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(150deg, #0F2040 0%, #1A365D 100%)',
        padding: isMobile ? '64px 20px' : '88px 40px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <p style={{ color: '#68D391', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 18 }}>
          Get Started
        </p>
        <h2 style={{
          fontSize: isMobile ? 28 : 42, fontWeight: 900, color: 'white',
          marginBottom: 16, letterSpacing: '-0.03em', lineHeight: 1.15,
        }}>
          Ready to get more interviews?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 36, fontSize: 15, maxWidth: 380, margin: '0 auto 36px' }}>
          Create a free account and scan your resume in minutes.
        </p>
        <button
          onClick={goToApp}
          style={{
            background: 'var(--emerald)', color: 'white', border: 'none',
            borderRadius: 'var(--radius)', padding: '15px 40px',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--emerald-light)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--emerald)')}>
          Start Free Scan →
        </button>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13, marginTop: 18 }}>
          Free ATS scan · No credit card required
        </p>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background: '#080F1E', padding: isMobile ? '44px 20px 32px' : '60px 40px 40px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: isMobile ? 36 : 60, flexWrap: 'wrap',
            marginBottom: 44,
            justifyContent: isMobile ? 'flex-start' : 'space-between',
          }}>
            {/* Brand */}
            <div style={{ flex: '1 1 200px' }}>
              <Logo size="sm" variant="light" />
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 14, lineHeight: 1.65, maxWidth: 220 }}>
                AI-powered resume optimization for job seekers who want results.
              </p>
            </div>

            {/* Product links */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Product</div>
              {[
                ['ATS Scanner', '/signup'],
                ['AI Optimizer', '/signup'],
                ['Cover Letter', '/signup'],
                ['LinkedIn', '/signup'],
                ['Pricing', '/pricing'],
              ].map(([label, href]) => (
                <div key={label} style={{ marginBottom: 11 }}>
                  <a
                    href={href}
                    style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, textDecoration: 'none', transition: 'color var(--transition)' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                    {label}
                  </a>
                </div>
              ))}
            </div>

            {/* Legal links */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Legal</div>
              {[
                ['Privacy Policy', '/privacy'],
                ['Terms of Service', '/terms'],
              ].map(([label, href]) => (
                <div key={label} style={{ marginBottom: 11 }}>
                  <a
                    href={href}
                    style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, textDecoration: 'none', transition: 'color var(--transition)' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                    {label}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 28, textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 13 }}>
              © {new Date().getFullYear()} AI Resume Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
