import { useNavigate } from 'react-router-dom'
import { ScoreRing } from '../../components/ScoreRing'
import { KeywordPill } from '../../components/KeywordPill'
import { LoadingCard, EmptyState } from './shared'
import { useIsMobile } from '../../hooks/useIsMobile'
import type { ScanResult } from '../../api/resumeApi'

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

  if (isLoading) return <LoadingCard message="Claude is evaluating your resume against the job description..." />
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
      background: 'white', borderRadius: 'var(--radius-lg)', padding: 32,
      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 10 }}>Add a Job Description to Get Your Score</h2>
      <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
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
            <span style={{ fontSize: 13, color: 'var(--charcoal)', marginLeft: 6 }}>
              Small differences between this score and optimization are expected — the two steps use different AI models.
            </span>
          </div>
        </div>
      )}

      {/* ── Score Card ── */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: isMobile ? 20 : 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <ScoreRing score={score} size={isMobile ? 80 : 110} />
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 5, fontWeight: 500 }}>
              {scoreToPercentile(score)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 800, color: 'var(--navy)' }}>ATS Compatibility Report</h2>
              {result.semantic && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'white', background: 'var(--emerald)', borderRadius: 999, padding: '2px 8px' }}>AI Scored</span>
              )}
            </div>
            <p style={{ fontSize: isMobile ? 13 : 14, color: 'var(--gray-500)', lineHeight: 1.6 }}>
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
          background: 'white',
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
            color: 'var(--charcoal)',
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
          background: 'white', borderRadius: 'var(--radius-lg)', padding: isMobile ? 16 : 20,
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 24 }}>🔒</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>Senior Recruiter Analysis — Pro feature</p>
            <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Upgrade to see how a recruiter would evaluate your resume.</p>
          </div>
        </div>
      )}

      {/* ── Score Breakdown ── */}
      {result.categoryScores?.length > 0 && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: isMobile ? 16 : 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 18 }}>Score Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {result.categoryScores.map(cat => {
              const pct = Math.min(100, cat.score)
              const barColor = cat.score >= 75 ? 'var(--emerald)' : cat.score >= 50 ? '#D97706' : 'var(--danger)'
              return (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{cat.name}</span>
                      {cat.weight && <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>{cat.weight}</span>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: barColor }}>{cat.score}</span>
                  </div>
                  <div style={{ background: 'var(--gray-100)', borderRadius: 999, height: 7, overflow: 'hidden', marginBottom: cat.reasoning ? 6 : 0 }}>
                    <div style={{ height: '100%', width: '100%', background: barColor, transform: `scaleX(${pct / 100})`, transformOrigin: 'left', transition: 'transform 0.8s ease' }} />
                  </div>
                  {cat.reasoning && (
                    <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.6, marginTop: 4 }}>{cat.reasoning}</p>
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
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)', marginBottom: 12 }}>✓ Strengths</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
                    <span style={{ fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.gaps?.length > 0 && (
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginBottom: 12 }}>✗ Gaps</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.gaps.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
                    <span style={{ fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.5 }}>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(result.strengths?.length > 0 || result.gaps?.length > 0) && !isPro && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Match Intelligence — Pro</h3>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
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
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)', marginBottom: 14 }}>
            ✓ Matched Skills ({result.matchedKeywords.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.matchedKeywords.slice(0, 24).map(kw => <KeywordPill key={kw} word={kw} type="matched" />)}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
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
