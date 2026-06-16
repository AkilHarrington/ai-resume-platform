import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Tab } from './shared'
import type { ScanResult, OptimizeResult } from '../../api/resumeApi'
import { scoreToPercentile } from '../../utils/scoreUtils'

interface Props {
  resumeText: string
  jobDescription: string
  companyName: string
  scanResult: ScanResult | null
  optimizeResult: OptimizeResult | null
  optimizedScore: number | null
  hasCoverLetter: boolean
  isPro: boolean
  setActiveTab: (tab: Tab) => void
  onRunScan: () => void
  onOpenJd: () => void
  isScanLoading: boolean
}

// ─── Progress strip ───────────────────────────────────────────────────────────
function ProgressStrip({ hasResume, hasScan, hasOptimize, hasCover }: {
  hasResume: boolean; hasScan: boolean; hasOptimize: boolean; hasCover: boolean
}) {
  const steps = [
    { label: 'Upload',       done: hasResume },
    { label: 'ATS Scan',     done: hasScan },
    { label: 'Optimize',     done: hasOptimize },
    { label: 'Cover Letter', done: hasCover },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((step, i) => (
        <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'unset' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: step.done ? 'var(--emerald)' : 'var(--surface-1)',
              border: `2px solid ${step.done ? 'var(--emerald)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
              color: step.done ? 'white' : 'var(--text-muted)',
              transition: 'all 0.3s ease',
            }}>
              {step.done ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: step.done ? 'var(--success)' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: '-14px 8px 0',
              background: step.done ? 'var(--emerald)' : 'var(--border)',
              transition: 'background 0.3s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--surface-0)', borderRadius: 12, padding: '20px',
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', flex: 1,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: color || 'var(--text-heading)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Tool card ────────────────────────────────────────────────────────────────
function ToolCard({ icon, title, desc, cta, onClick, locked }: {
  icon: string; title: string; desc: string; cta: string; onClick: () => void; locked?: boolean
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface-0)', borderRadius: 12, padding: 20,
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer', flex: 1, minWidth: 160, transition: 'all 0.15s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--navy)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {locked && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          fontSize: 9, fontWeight: 800, color: 'var(--emerald)',
          background: 'var(--success-light)', padding: '2px 6px', borderRadius: 999,
        }}>PRO</span>
      )}
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>{desc}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: locked ? 'var(--text-muted)' : 'var(--navy)' }}>
        {cta} →
      </div>
    </div>
  )
}

// ─── Completion card ──────────────────────────────────────────────────────────
function CompletionCard({ atsScore, optimizedScore, companyName, onOptimize }: {
  atsScore: number | null
  optimizedScore: number | null
  companyName: string
  onOptimize: () => void
}) {
  const [tipsOpen, setTipsOpen] = useState(false)
  const improvement = (optimizedScore && atsScore) ? optimizedScore - atsScore : null
  const effectiveScore = optimizedScore ?? atsScore ?? 0
  const percentile = scoreToPercentile(effectiveScore)
  const forCompany = companyName ? ` for ${companyName}` : ''

  // ── Score-tiered config ────────────────────────────────────────────────────
  const isReady   = effectiveScore >= 75
  const isClose   = effectiveScore >= 60 && effectiveScore < 75
  const needsWork = effectiveScore >= 45 && effectiveScore < 60
  const isStretch = effectiveScore < 45

  const cardBg = isReady
    ? 'linear-gradient(135deg, var(--emerald) 0%, #1A365D 100%)'
    : isClose
    ? 'linear-gradient(135deg, #D97706 0%, #1A365D 100%)'
    : 'linear-gradient(135deg, #B91C1C 0%, #1A365D 100%)'

  const emoji   = isReady ? '🎉' : isClose ? '⚡' : needsWork ? '🎯' : '💡'
  const title   = isReady
    ? "You're ready to apply!"
    : isClose
    ? 'Your materials are complete — here\'s how to strengthen your odds'
    : needsWork
    ? 'Your materials are ready — the gap is large, but you can still compete'
    : 'This role is a stretch — here\'s how to apply strategically'

  const scoreNote = optimizedScore && atsScore && improvement && improvement > 0
    ? `Your resume jumped ${atsScore} → ${optimizedScore}${forCompany}.`
    : atsScore
    ? `Your resume scored ${effectiveScore}${forCompany}.`
    : ''

  const summary = isReady
    ? `${scoreNote} You're in the ${percentile} of applicants — go apply.`
    : isClose
    ? `${scoreNote} You're competitive but keyword gaps remain. Applying is worth it — use the tips below to improve your real-world odds.`
    : needsWork
    ? `${scoreNote} Your score signals significant gaps. The optimizer has done what it can with the resume. These tactics will improve your actual chances more than further edits.`
    : `${scoreNote} This role requires skills your resume doesn't yet demonstrate. ATS systems rank applicants — they don't always auto-reject. A smart strategy can still get you in front of a human.`

  // ── Tips by track ─────────────────────────────────────────────────────────
  type Tip = { track: string; trackColor: string; bullets: string[] }
  const tips: Tip[] = isReady ? [] : [
    {
      track: 'What the tool addressed',
      trackColor: 'rgba(255,255,255,0.5)',
      bullets: isClose
        ? ['Missing keywords were added and bullet phrasing was strengthened.', 'Run the optimizer again after adding any certifications or tools you\'re currently working toward.']
        : ['The optimizer rewrote your bullets and added available keywords — that\'s the maximum the resume alone can do.', 'Adding real certifications or tools to your actual experience will move the score further than any rewrite can.'],
    },
    {
      track: 'What you can do beyond the resume',
      trackColor: 'rgba(255,255,255,0.7)',
      bullets: isClose
        ? [
            'Write a cover letter that directly addresses the 2–3 most critical missing keywords — explain how your experience maps to them.',
            'Connect with someone at the company on LinkedIn before applying. A referral can route your application past ATS filtering entirely.',
            'Tailor your LinkedIn headline and About section to match the job title and top keywords.',
          ]
        : [
            'A strong cover letter addressing the skill gaps directly is more valuable than a higher ATS score at this range.',
            'Find a referral. One internal connection who forwards your resume to the hiring manager outweighs a 20-point score difference.',
            'If the role requires a certification you don\'t have, mention you\'re enrolled or pursuing it — in the cover letter and LinkedIn, not just the resume.',
            'Apply anyway. 92% of ATS systems rank rather than auto-reject. A human may still see your application.',
          ],
    },
  ]

  return (
    <div style={{
      background: cardBg,
      borderRadius: 14, padding: '24px 28px', animation: 'fadeIn 0.4s ease',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    }}>
      {/* Header */}
      <div style={{ fontSize: 32, marginBottom: 10 }}>{emoji}</div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 8 }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, maxWidth: 560, marginBottom: 16 }}>
        {summary}
      </p>

      {/* Score chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: tips.length ? 16 : 0 }}>
        {[
          atsScore && `ATS Score: ${atsScore}`,
          optimizedScore && optimizedScore !== atsScore && `Optimized: ${optimizedScore}`,
          improvement && improvement > 0 && `+${improvement} points`,
        ].filter(Boolean).map((label, i) => (
          <span key={i} style={{
            fontSize: 11, fontWeight: 700, color: 'white',
            background: 'rgba(255,255,255,0.18)', borderRadius: 999, padding: '4px 12px',
          }}>
            {label as string}
          </span>
        ))}
      </div>

      {/* Tips section — hidden for 75+ */}
      {tips.length > 0 && (
        <div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '0 0 14px' }} />
          <button
            onClick={() => setTipsOpen(v => !v)}
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 7, padding: '7px 16px', color: 'white',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tipsOpen ? '▲ Hide tips' : '▼ How to improve your real chances'}
          </button>

          {tipsOpen && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tips.map(tip => (
                <div key={tip.track}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: tip.trackColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {tip.track}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {tip.bullets.map((b, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0, marginTop: 2 }}>→</span>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>{b}</span>
                      </div>
                    ))}
                  </div>
                  {/* Optimize CTA on track 1 for non-ready scores */}
                  {tip.track === 'What the tool addressed' && !isClose && (
                    <button
                      onClick={onOptimize}
                      style={{
                        marginTop: 10, background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.3)', borderRadius: 7,
                        padding: '7px 16px', color: 'white', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Re-run Optimizer →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DashboardTab({
  resumeText, jobDescription, companyName,
  scanResult, optimizeResult, optimizedScore, hasCoverLetter,
  isPro, setActiveTab, onRunScan, onOpenJd, isScanLoading,
}: Props) {
  const navigate = useNavigate()
  const atsScore = scanResult?.overallScore ?? null
  const wordCount = resumeText.split(/\s+/).filter(Boolean).length

  const hasScan = !!scanResult
  const hasOptimize = !!optimizeResult
  const allDone = hasScan && hasOptimize && hasCoverLetter

  const scoreColor = atsScore === null
    ? 'var(--text-heading)'
    : atsScore >= 75 ? 'var(--success)' : atsScore >= 55 ? '#D97706' : 'var(--danger)'

  // ── Directive CTA — one clear step at a time ──────────────────────────────
  type CtaConfig = {
    label: string
    sub: string
    buttonLabel: string
    onAction: () => void
    variant?: 'primary' | 'jd'
  }

  const cta: CtaConfig | null = allDone
    ? null // completion card replaces the banner
    : !jobDescription.trim()
    ? {
        label: 'Step 1: Add a Job Description',
        sub: 'A JD unlocks role-specific ATS scoring and tailored optimization.',
        buttonLabel: '+ Add Job Description',
        onAction: onOpenJd,
        variant: 'jd',
      }
    : !hasScan
    ? {
        label: '✓ Job description added — Run your ATS Scan',
        sub: 'See exactly how your resume scores against this role.',
        buttonLabel: isScanLoading ? 'Scanning…' : 'Run ATS Scan →',
        onAction: onRunScan,
        variant: 'primary',
      }
    : !hasOptimize && isPro
    ? {
        label: 'Optimize your resume',
        sub: `Your score is ${atsScore} — Claude can push it higher by closing keyword gaps.`,
        buttonLabel: 'Optimize Now →',
        onAction: () => setActiveTab('optimize'),
        variant: 'primary',
      }
    : !hasCoverLetter && isPro
    ? {
        label: 'Write your cover letter',
        sub: 'Claude drafts a tailored letter from your resume and job description.',
        buttonLabel: 'Generate Cover Letter →',
        onAction: () => setActiveTab('cover-letter'),
        variant: 'primary',
      }
    : !isPro
    ? {
        label: 'Unlock AI optimization',
        sub: 'Optimize your resume, generate cover letters, and refine your LinkedIn profile.',
        buttonLabel: 'Upgrade to Pro →',
        onAction: () => navigate('/pricing'),
        variant: 'primary',
      }
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.25s ease' }}>

      {/* Header + progress */}
      <div style={{
        background: 'var(--surface-0)', borderRadius: 12, padding: '22px 24px',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 2 }}>
          Your Resume Dashboard
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
          {wordCount} words loaded
        </p>
        <ProgressStrip
          hasResume={!!resumeText}
          hasScan={hasScan}
          hasOptimize={hasOptimize}
          hasCover={hasCoverLetter}
        />
      </div>

      {/* Completion card (all steps done) */}
      {allDone && (
        <CompletionCard
          atsScore={atsScore}
          optimizedScore={optimizedScore}
          companyName={companyName}
          onOptimize={() => setActiveTab('optimize')}
        />
      )}

      {/* Directive CTA banner */}
      {cta && (
        <div style={{
          background: cta.variant === 'jd' ? 'var(--surface-0)' : 'var(--navy)',
          border: cta.variant === 'jd' ? '2px dashed var(--border-input)' : '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '18px 22px',
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: cta.variant === 'jd' ? 'var(--shadow-sm)' : 'var(--shadow)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: cta.variant === 'jd' ? 'var(--text-heading)' : 'white', marginBottom: 3 }}>
              {cta.label}
            </div>
            <div style={{ fontSize: 12, color: cta.variant === 'jd' ? 'var(--text-secondary)' : 'rgba(255,255,255,0.65)' }}>
              {cta.sub}
            </div>
          </div>
          <button
            onClick={cta.onAction}
            disabled={isScanLoading && !hasScan}
            style={{
              background: cta.variant === 'jd' ? 'var(--navy)' : 'rgba(255,255,255,0.15)',
              color: 'white',
              border: cta.variant === 'jd' ? 'none' : '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
              opacity: (isScanLoading && !hasScan) ? 0.7 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            {cta.buttonLabel}
          </button>
        </div>
      )}

      {/* Metric cards — only after scan */}
      {hasScan && (
        <div style={{ display: 'flex', gap: 12 }}>
          {atsScore !== null && (
            <MetricCard
              label="ATS Score"
              value={atsScore}
              sub={atsScore >= 75 ? 'Strong match' : atsScore >= 55 ? 'Needs work' : 'Low match'}
              color={scoreColor}
            />
          )}
          {optimizedScore !== null && optimizedScore > 0 && (
            <MetricCard
              label="Optimized Score"
              value={optimizedScore}
              sub={`+${Math.max(0, optimizedScore - (atsScore ?? 0))} points gained`}
              color="var(--success)"
            />
          )}
          {optimizeResult && (() => {
            const afterSet = new Set(optimizeResult.missingKeywordsAfter.map(k => k.toLowerCase()))
            const added = optimizeResult.missingKeywordsBefore.filter(k => !afterSet.has(k.toLowerCase())).length
            return added > 0 ? (
              <MetricCard
                label="Keywords Added"
                value={added}
                sub="from job description"
              />
            ) : null
          })()}
        </div>
      )}

      {/* Tool cards — only shown after first scan so dashboard isn't noisy before user has context */}
      {hasScan && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Tools
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ToolCard icon="🎯" title="ATS Scan" desc="Score your resume against any job description" cta="Re-run scan" onClick={() => setActiveTab('scan')} />
            <ToolCard icon="✨" title="Optimize" desc="Claude rewrites your resume for the role" cta={isPro ? 'Optimize now' : 'Unlock'} onClick={() => setActiveTab('optimize')} locked={!isPro} />
            <ToolCard icon="📝" title="Cover Letter" desc="Tailored cover letter in your voice" cta={isPro ? 'Generate' : 'Unlock'} onClick={() => setActiveTab('cover-letter')} locked={!isPro} />
            <ToolCard icon="💼" title="LinkedIn" desc="Headline and About section for your target role" cta={isPro ? 'Optimize' : 'Unlock'} onClick={() => setActiveTab('linkedin')} locked={!isPro} />
          </div>
        </div>
      )}
    </div>
  )
}
