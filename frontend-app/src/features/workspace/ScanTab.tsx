import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScoreRing } from '../../components/ScoreRing'
import { KeywordPill } from '../../components/KeywordPill'
import { EmptyState } from './shared'
import { useIsMobile } from '../../hooks/useIsMobile'
import type { ScanResult } from '../../api/resumeApi'

// ─── Scan loading skeleton — step indicator + content preview ─────────────────

function ScanStepSkeleton() {
  const isMobile = useIsMobile()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(1), 2500)
    const t2 = setTimeout(() => setActiveStep(2), 6000)
    const t3 = setTimeout(() => setActiveStep(3), 13000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const steps = ['Reading your resume', 'Matching keywords', 'AI scoring', 'Building report']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease' }}>

      {/* ── Step progress ── */}
      <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 14 }}>Analyzing your resume…</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((label, i) => {
            const done   = i < activeStep
            const active = i === activeStep
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  background: done   ? 'var(--success-light)' : active ? 'var(--navy)' : 'var(--surface-2)',
                  color:      done   ? 'var(--success)'       : active ? 'white'       : 'var(--text-muted)',
                  transition: 'background 0.4s ease, color 0.4s ease',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: done ? 'var(--text-muted)' : active ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'color 0.4s ease',
                }}>
                  {label}
                </span>
                {active && (
                  <span style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--navy)', marginLeft: 2,
                    animation: 'pulse 1s ease-in-out infinite',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Score card skeleton ── */}
      <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: isMobile ? 20 : 28, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 32, flexWrap: 'wrap' }}>
          <div style={{
            width: isMobile ? 80 : 110, height: isMobile ? 80 : 110,
            borderRadius: '50%', flexShrink: 0,
            background: 'var(--surface-2)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 18, width: '55%', borderRadius: 4, background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out 0.1s infinite' }} />
            <div style={{ height: 12, width: '90%', borderRadius: 4, background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out 0.2s infinite' }} />
            <div style={{ height: 12, width: '70%', borderRadius: 4, background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out 0.3s infinite' }} />
          </div>
        </div>
      </div>

      {/* ── Score breakdown skeleton ── */}
      <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: isMobile ? 16 : 24, border: '1px solid var(--border)' }}>
        <div style={{ height: 14, width: 120, borderRadius: 4, background: 'var(--surface-2)', marginBottom: 18, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[70, 50, 80, 60, 45, 65].map((w, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ height: 11, width: `${w}%`, borderRadius: 4, background: 'var(--surface-2)', animation: `pulse 1.5s ease-in-out ${i * 0.06}s infinite` }} />
                <div style={{ height: 11, width: 24, borderRadius: 4, background: 'var(--surface-2)', animation: `pulse 1.5s ease-in-out ${i * 0.06}s infinite` }} />
              </div>
              <div style={{ height: 7, borderRadius: 999, background: 'var(--surface-2)', animation: `pulse 1.5s ease-in-out ${i * 0.06 + 0.1}s infinite` }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Keyword chips skeleton ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {[0, 1].map((ci) => (
          <div key={ci} style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ height: 13, width: 100, borderRadius: 4, background: 'var(--surface-2)', marginBottom: 14, animation: `pulse 1.5s ease-in-out ${ci * 0.15}s infinite` }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[52, 68, 44, 76, 58, 40, 64, 50, 72, 46].map((w, i) => (
                <div key={i} style={{
                  height: 22, width: w,
                  borderRadius: 999, background: 'var(--surface-2)',
                  animation: `pulse 1.5s ease-in-out ${(i + ci * 5) * 0.07}s infinite`,
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Score percentile helper ──────────────────────────────────────────────────

function scoreToPercentile(score: number): string {
  if (score >= 92) return 'Top 5% of applicants'
  if (score >= 85) return 'Top 10% of applicants'
  if (score >= 80) return 'Top 20% of applicants'
  if (score >= 75) return 'Top 30% of applicants'
  if (score >= 68) return 'Top 40% of applicants'
  if (score >= 60) return 'Top 50% of applicants'
  if (score >= 50) return 'Bottom 40% of applicants'
  return 'Bottom 25% of applicants'
}

interface Props {
  result: ScanResult | null
  isLoading: boolean
  hasResume: boolean
  isPro: boolean
  error: string
  optimizedScore?: number | null
}

export function ScanTab({ result, isLoading, hasResume, isPro, error, optimizedScore }: Props) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  if (isLoading) return <ScanStepSkeleton />
  if (!result) return (
    <>
      <EmptyState
        icon="🎯"
        title="Your ATS report will appear here"
        subtitle={hasResume ? 'Click "Run ATS Scan" to get your score.' : 'Upload or paste your resume to get started.'}
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>{error}</p>}
    </>
  )

  if (result.noJd) return (
    <div style={{
      background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 32,
      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 10 }}>Add a Job Description to Get Your Score</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
        Paste the job description you're targeting in the left panel, then run the scan again.
        Without a JD, there's nothing to match your resume against.
      </p>
    </div>
  )

  const score = result.overallScore ?? 0
  const scoreColor = score >= 75 ? 'var(--success)' : score >= 55 ? '#D97706' : 'var(--danger)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>

      {/* Optimized score context banner */}
      {optimizedScore != null && optimizedScore > 0 && (
        <div style={{
          background: 'var(--success-light)', border: '1px solid var(--success)',
          borderRadius: 'var(--radius-lg)', padding: '12px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>
              Your optimized resume scored {optimizedScore} during optimization.
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', marginLeft: 6 }}>
              Small differences between this score and optimization are expected — the two steps use different AI models.
            </span>
          </div>
        </div>
      )}

      {/* ── Score Card ── */}
      <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: isMobile ? 20 : 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <ScoreRing score={score} size={isMobile ? 80 : 110} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontWeight: 500 }}>
              {scoreToPercentile(score)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 800, color: 'var(--text-heading)' }}>ATS Compatibility Report</h2>
              {result.semantic && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'white', background: 'var(--emerald)', borderRadius: 999, padding: '2px 8px' }}>AI Scored</span>
              )}
            </div>
            <p style={{ fontSize: isMobile ? 13 : 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {score >= 75
                ? 'Strong compatibility. Your resume is likely to pass automated screening.'
                : score >= 55
                  ? 'Moderate compatibility. Some key areas need strengthening.'
                  : 'Low compatibility. Your resume may be filtered out before a human sees it.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Recruiter Verdict — own card, prominent ── */}
      {result.recruiterVerdict && isPro && (
        <div style={{
          background: 'var(--surface-0)',
          borderRadius: 'var(--radius-lg)',
          padding: isMobile ? 20 : 24,
          boxShadow: 'var(--shadow-sm)',
          border: `1px solid ${scoreColor}`,
          borderLeft: `5px solid ${scoreColor}`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle background accent */}
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 120, height: 120,
            background: `radial-gradient(circle at top right, ${scoreColor}10, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>👤</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Senior Recruiter Analysis
            </span>
          </div>
          <p style={{
            fontSize: isMobile ? 13 : 14,
            color: 'var(--text-primary)',
            lineHeight: 1.75,
            fontStyle: 'italic',
            margin: 0,
          }}>
            "{result.recruiterVerdict}"
          </p>
        </div>
      )}

      {result.recruiterVerdict && !isPro && (
        <div style={{
          background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: isMobile ? 16 : 20,
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-input)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 24 }}>🔒</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 2 }}>Senior Recruiter Analysis — Pro feature</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Upgrade to see how a recruiter would evaluate your resume.</p>
          </div>
        </div>
      )}

      {/* ── Score Breakdown ── */}
      {result.categoryScores?.length > 0 && (
        <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: isMobile ? 16 : 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 18 }}>Score Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {result.categoryScores.map(cat => {
              const pct = Math.min(100, cat.score)
              const barColor = cat.score >= 75 ? 'var(--emerald)' : cat.score >= 50 ? '#D97706' : 'var(--danger)'
              return (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
                      {cat.weight && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{cat.weight}</span>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: barColor }}>{cat.score}</span>
                  </div>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 999, height: 7, overflow: 'hidden', marginBottom: cat.reasoning ? 6 : 0 }}>
                    <div style={{ height: '100%', width: '100%', background: barColor, transform: `scaleX(${pct / 100})`, transformOrigin: 'left', transition: 'transform 0.8s ease' }} />
                  </div>
                  {cat.reasoning && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 4 }}>{cat.reasoning}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Strengths & Gaps — Pro only ── */}
      {(result.strengths?.length > 0 || result.gaps?.length > 0) && isPro && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          {result.strengths?.length > 0 && (
            <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)', marginBottom: 12 }}>✓ Strengths</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.gaps?.length > 0 && (
            <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginBottom: 12 }}>✗ Gaps</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.gaps.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(result.strengths?.length > 0 || result.gaps?.length > 0) && !isPro && (
        <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Match Intelligence — Pro</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Unlock your resume's strengths, skill gaps, and recruiter verdict with a Pro plan.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            style={{ background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 'var(--radius)', padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* ── Matched / Missing Skills ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)', marginBottom: 14 }}>
            ✓ Matched Skills ({result.matchedKeywords.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.matchedKeywords.slice(0, 24).map(kw => <KeywordPill key={kw} word={kw} type="matched" />)}
          </div>
        </div>
        <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginBottom: 14 }}>
            ✗ Missing Skills ({result.missingKeywords.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.missingKeywords.slice(0, 24).map(kw => <KeywordPill key={kw} word={kw} type="missing" />)}
          </div>
        </div>
      </div>
    </div>
  )
}
