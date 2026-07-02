import { useState, useMemo, useEffect, useRef } from 'react'
import { Button } from '../../components/Button'
import { ScoreRing } from '../../components/ScoreRing'
import { EmptyState, EmptyCard, IconEdit, UpgradePrompt } from './shared'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../app/AuthContext'
import type { OptimizeResult } from '../../api/resumeApi'
import { downloadResumeDocx, previewOptimize, skillsFirstReformat } from '../../api/resumeApi'
import type { ResumeTemplate } from '../../types/resumeTemplate'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

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

// ─── Line-level diff ──────────────────────────────────────────────────────────

type DiffLine = { type: 'same' | 'add' | 'remove'; text: string }

function computeLineDiff(original: string, optimized: string): DiffLine[] {
  const a = original.split('\n')
  const b = optimized.split('\n')
  const m = a.length, n = b.length

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  const result: DiffLine[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'same', text: b[j - 1] }); i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', text: b[j - 1] }); j--
    } else {
      result.unshift({ type: 'remove', text: a[i - 1] }); i--
    }
  }
  return result
}

// ─── Palette picker ───────────────────────────────────────────────────────────

const PALETTE_OPTIONS = [
  { id: 'blue',       label: 'Navy',      hex: '#1A365D' },
  { id: 'charcoal',   label: 'Charcoal',  hex: '#1F2937' },
  { id: 'slate',      label: 'Slate',     hex: '#334155' },
  { id: 'forest',     label: 'Forest',    hex: '#14532D' },
  { id: 'monochrome', label: 'Mono',      hex: '#000000' },
] as const
type ResumePalette = typeof PALETTE_OPTIONS[number]['id']

// ─── Template picker ──────────────────────────────────────────────────────────

const TEMPLATE_OPTIONS: { id: ResumeTemplate; label: string; description: string; badge: string; preview: string }[] = [
  { id: 'professional', label: 'Professional', description: 'Single column · ATS-safe · Helvetica', badge: 'ATS',     preview: 'single' },
  { id: 'modern',       label: 'Modern',       description: 'Navy sidebar · Two-column · Skills tags', badge: 'POPULAR',  preview: 'sidebar' },
  { id: 'executive',    label: 'Executive',    description: 'Centered header · Serif body · Boardroom', badge: 'PREMIUM',  preview: 'centered' },
]

function TemplatePreview({ type, selected }: { type: string; selected: boolean }) {
  const bg     = selected ? 'rgba(255,255,255,0.15)' : '#F3F4F6'
  const line   = selected ? 'rgba(255,255,255,0.5)'  : '#D1D5DB'
  const accent = selected ? 'rgba(255,255,255,0.9)'  : '#9CA3AF'
  const dark   = selected ? '#FFFFFF'                : '#6B7280'

  if (type === 'sidebar') return (
    <svg width="44" height="56" viewBox="0 0 44 56" fill="none" style={{ borderRadius: 3 }}>
      <rect width="44" height="56" fill={bg} rx="2" />
      <rect x="0" y="0" width="14" height="56" fill={selected ? 'rgba(255,255,255,0.25)' : '#CBD5E1'} rx="2" />
      <rect x="2" y="6"  width="10" height="1.5" fill={accent} rx="1" />
      <rect x="2" y="10" width="8"  height="1"   fill={line}   rx="0.5" />
      <rect x="2" y="13" width="9"  height="1"   fill={line}   rx="0.5" />
      <rect x="2" y="18" width="10" height="1"   fill={accent} rx="1" />
      <rect x="2" y="21" width="4"  height="1"   fill={line}   rx="0.5" />
      <rect x="7" y="21" width="4"  height="1"   fill={line}   rx="0.5" />
      <rect x="2" y="24" width="5"  height="1"   fill={line}   rx="0.5" />
      <rect x="17" y="6"  width="24" height="1.5" fill={dark} rx="1" />
      <rect x="17" y="10" width="20" height="1"   fill={line} rx="0.5" />
      <rect x="17" y="13" width="22" height="1"   fill={line} rx="0.5" />
      <rect x="17" y="16" width="18" height="1"   fill={line} rx="0.5" />
      <rect x="17" y="22" width="24" height="1.5" fill={dark} rx="1" />
      <rect x="17" y="26" width="22" height="1"   fill={line} rx="0.5" />
      <rect x="17" y="29" width="20" height="1"   fill={line} rx="0.5" />
      <rect x="17" y="32" width="21" height="1"   fill={line} rx="0.5" />
    </svg>
  )

  if (type === 'centered') return (
    <svg width="44" height="56" viewBox="0 0 44 56" fill="none" style={{ borderRadius: 3 }}>
      <rect width="44" height="56" fill={bg} rx="2" />
      <rect x="10" y="5"    width="24" height="2"    fill={dark}   rx="1" />
      <rect x="13" y="9"    width="18" height="1"    fill={accent} rx="0.5" />
      <rect x="6"  y="12"   width="32" height="0.5"  fill={accent} rx="0.25" />
      <rect x="6"  y="14"   width="32" height="0.25" fill={line}   rx="0.25" />
      <rect x="6"  y="18"   width="16" height="1.5"  fill={dark}   rx="0.5" />
      <rect x="6"  y="20.5" width="32" height="0.5"  fill={accent} rx="0.25" />
      <rect x="6"  y="21.5" width="32" height="0.25" fill={line}   rx="0.25" />
      <rect x="6"  y="24"   width="32" height="1"    fill={line}   rx="0.5" />
      <rect x="6"  y="27"   width="28" height="1"    fill={line}   rx="0.5" />
      <rect x="6"  y="32"   width="18" height="1.5"  fill={dark}   rx="0.5" />
      <rect x="6"  y="34.5" width="32" height="0.5"  fill={accent} rx="0.25" />
      <rect x="6"  y="35.5" width="32" height="0.25" fill={line}   rx="0.25" />
      <rect x="6"  y="38"   width="32" height="1"    fill={line}   rx="0.5" />
      <rect x="6"  y="41"   width="24" height="1"    fill={line}   rx="0.5" />
    </svg>
  )

  return (
    <svg width="44" height="56" viewBox="0 0 44 56" fill="none" style={{ borderRadius: 3 }}>
      <rect width="44" height="56" fill={bg} rx="2" />
      <rect x="4" y="5"    width="22" height="2"    fill={dark} rx="1" />
      <rect x="4" y="9"    width="10" height="0.75" fill={line} rx="0.5" />
      <rect x="16" y="9"   width="8"  height="0.75" fill={line} rx="0.5" />
      <rect x="26" y="9"   width="12" height="0.75" fill={line} rx="0.5" />
      <rect x="4" y="12"   width="36" height="1"    fill={accent} rx="0.5" />
      <rect x="4" y="16"   width="16" height="1"    fill={dark} rx="0.5" />
      <rect x="4" y="17.5" width="36" height="0.5"  fill={line} rx="0.25" />
      <rect x="4" y="20"   width="36" height="0.75" fill={line} rx="0.5" />
      <rect x="4" y="22.5" width="30" height="0.75" fill={line} rx="0.5" />
      <rect x="4" y="27"   width="20" height="1"    fill={dark} rx="0.5" />
      <rect x="4" y="28.5" width="36" height="0.5"  fill={line} rx="0.25" />
      <rect x="4" y="31"   width="24" height="0.75" fill={line} rx="0.5" />
      <rect x="4" y="33.5" width="32" height="0.75" fill={line} rx="0.5" />
      <rect x="4" y="36"   width="28" height="0.75" fill={line} rx="0.5" />
      <rect x="4" y="38.5" width="30" height="0.75" fill={line} rx="0.5" />
    </svg>
  )
}

// ─── Streaming live view (replaces the spinner) ───────────────────────────────

function StreamingResumeView({
  text,
  statusMessage,
  originalScore,
}: {
  text: string
  statusMessage: string
  originalScore?: number
}) {
  const isScoring  = statusMessage.toLowerCase().includes('scoring your improvements')
  const isWriting  = !isScoring && text.length > 0
  const isStarting = !text

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease' }}>

      {/* ── Score row — before ring visible immediately ── */}
      <div style={{
        background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
        padding: '24px 28px', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
      }}>
        {originalScore !== undefined && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Before</div>
              <ScoreRing score={originalScore} size={80} label="" />
            </div>
            <div style={{ fontSize: 26, color: 'var(--border)' }}>→</div>
          </>
        )}
        {/* Pending "After" ring */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>After</div>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            border: '3px dashed var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>…</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>
            {isScoring  ? '✓ Resume rewritten — scoring improvements…'
            : isWriting ? 'Claude is rewriting your resume…'
            :             'Connecting to Claude…'}
          </div>
          {/* Step progress indicator — driven by live SSE status messages */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {['Keywords', 'Rewriting', 'Scoring', 'Done'].map((label, i) => {
              const curStep  = isStarting ? 0 : isScoring ? 2 : 1
              const isDone   = i < curStep
              const isActive = i === curStep
              return [
                <div key={`s${i}`} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 7, fontWeight: 800,
                    background: isDone ? 'var(--success-light)' : isActive ? 'var(--navy)' : 'var(--surface-2)',
                    color: isDone ? 'var(--success)' : isActive ? 'white' : 'var(--text-muted)',
                    transition: 'background 0.3s ease, color 0.3s ease',
                  }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>,
                i < 3
                  ? <div key={`l${i}`} style={{ height: 1, width: 10, background: isDone ? 'var(--success)' : 'var(--border)', transition: 'background 0.3s', flexShrink: 0 }} />
                  : null,
              ]
            }).flat()}
          </div>
        </div>
      </div>

      {/* ── Live text stream ── */}
      <div style={{
        background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface-1)',
        }}>
          {isScoring ? (
            <span style={{ fontSize: 13, color: 'var(--success)' }}>✓</span>
          ) : (
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isStarting ? 'var(--text-muted)' : 'var(--success)',
              display: 'inline-block',
              animation: 'pulse 1s ease-in-out infinite',
              flexShrink: 0,
            }} />
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {isScoring  ? 'Resume complete — scoring in progress'
            : isWriting ? 'Writing your resume…'
            :             statusMessage || 'Starting…'}
          </span>
        </div>

        {/* Streaming text */}
        {isStarting ? (
          /* Skeleton lines shown while waiting for first token (~1-2s) */
          <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[100, 60, 80, 40, 90, 55, 70, 45, 85, 50].map((w, i) => (
              <div key={i} style={{
                height: 12, borderRadius: 4,
                width: `${w}%`,
                background: 'var(--surface-1)',
                animation: `pulse 1.5s ease-in-out ${i * 0.08}s infinite`,
              }} />
            ))}
          </div>
        ) : (
          <pre style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--text-primary)',
            lineHeight: 1.75,
            maxHeight: 440,
            overflow: 'auto',
            padding: '16px 20px',
            margin: 0,
          }}>
            {text}
            {isWriting && (
              <span style={{
                display: 'inline-block', width: 2, height: '1em',
                background: 'var(--navy)', marginLeft: 1, verticalAlign: 'text-bottom',
                animation: 'blink 1s step-end infinite',
              }} />
            )}
          </pre>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  result: OptimizeResult | null
  isLoading: boolean
  hasResume: boolean
  onRun: () => void
  error: string
  streamingText?: string
  statusMessage?: string
  originalScore?: number
  isPro?: boolean
  resumeText?: string
  jobDescription?: string
  targetRole?: string
  scanGaps?: string[]
}

export function OptimizeTab({ result, isLoading, hasResume, onRun, error, streamingText, statusMessage, originalScore, isPro, resumeText, jobDescription, targetRole, scanGaps = [] }: Props) {
  const { showToast } = useToast()
  const { session } = useAuth()
  const [view, setView] = useState<'optimized' | 'original' | 'changes'>('optimized')
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>('professional')
  const [selectedPalette, setSelectedPalette] = useState<ResumePalette>('blue')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false)

  // ── Skills-first toggle ───────────────────────────────────────────────────
  const [skillsFirstText, setSkillsFirstText] = useState<string | null>(null)
  const [activeVersion, setActiveVersion] = useState<'original' | 'skills-first'>('original')
  const [isLoadingSkillsFirst, setIsLoadingSkillsFirst] = useState(false)
  const [skillsFirstError, setSkillsFirstError] = useState('')

  // Reset skills-first state whenever a new result arrives
  const prevResultRef = useRef<OptimizeResult | null>(null)
  if (result !== prevResultRef.current) {
    prevResultRef.current = result
    if (skillsFirstText !== null) {
      // Can't call setState during render — schedule via effect workaround below
    }
  }

  useEffect(() => {
    // Clear skills-first state when result changes (new optimization run)
    setSkillsFirstText(null)
    setActiveVersion('original')
    setSkillsFirstError('')
  }, [result])

  const handleSkillsFirstToggle = async () => {
    if (!result?.optimizedResumeText) return
    if (skillsFirstText) {
      // Already generated — just flip the version
      setActiveVersion(prev => prev === 'original' ? 'skills-first' : 'original')
      return
    }
    setIsLoadingSkillsFirst(true)
    setSkillsFirstError('')
    try {
      const reformatted = await skillsFirstReformat({
        resumeText: result.optimizedResumeText,
        jobDescription: jobDescription ?? '',
        targetRole: targetRole ?? '',
      })
      // Validate: count year-pattern lines to detect dropped job entries
      const countJobEntries = (text: string) =>
        (text.match(/\b(19|20)\d{2}\b/g) || []).length
      const beforeCount = countJobEntries(result.optimizedResumeText)
      const afterCount  = countJobEntries(reformatted)
      if (afterCount < beforeCount - 2) {
        setSkillsFirstError('Restructuring dropped some content. Please try again.')
        return
      }
      setSkillsFirstText(reformatted)
      setActiveVersion('skills-first')
    } catch (e: unknown) {
      setSkillsFirstError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setIsLoadingSkillsFirst(false)
    }
  }

  // displayedText: routes PDF/DOCX/copy to whichever version is active
  const displayedResumeText = (activeVersion === 'skills-first' && skillsFirstText)
    ? skillsFirstText
    : result?.optimizedResumeText ?? ''

  // ── Blurred preview for free users ───────────────────────────────────────
  const [previewBullets, setPreviewBullets] = useState<string[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewFired = useRef(false)

  useEffect(() => {
    // Only fire once per mount, only for free users without a result yet
    if (isPro || result || isLoading || !resumeText || previewFired.current) return
    previewFired.current = true
    setPreviewLoading(true)
    previewOptimize({ resumeText, jobDescription })
      .then(data => setPreviewBullets(data.bullets))
      .catch(() => {})
      .finally(() => setPreviewLoading(false))
  }, [isPro, result, isLoading, resumeText, jobDescription])

  const addedKeywords = useMemo(() => {
    if (!result) return []
    const afterSet = new Set(result.missingKeywordsAfter.map(k => k.toLowerCase()))
    return result.missingKeywordsBefore.filter(k => !afterSet.has(k.toLowerCase()))
  }, [result])

  const bulletChanges = useMemo(() => {
    if (!result) return 0
    const isBullet = (l: string) => /^\s*[•\-–—›»*]/.test(l)
    const origBullets = result.originalResumeText.split('\n').filter(isBullet)
    const optBullets  = result.optimizedResumeText.split('\n').filter(isBullet)
    let changed = 0
    const len = Math.min(origBullets.length, optBullets.length)
    for (let i = 0; i < len; i++) {
      if (origBullets[i].trim() !== optBullets[i].trim()) changed++
    }
    return changed + Math.max(0, optBullets.length - origBullets.length)
  }, [result])

  const lineDiff = useMemo(() => {
    if (!result) return null
    return computeLineDiff(result.originalResumeText, result.optimizedResumeText)
  }, [result])

  const handleDownloadPDF = async () => {
    if (!displayedResumeText) return
    setIsDownloading(true)
    try {
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')
      const resp = await fetch(`${API_BASE}/api/v1/resume/download-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeText: displayedResumeText, template: selectedTemplate, palette: selectedPalette }),
      })
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}))
        throw new Error((detail as { detail?: string }).detail ?? `Server error ${resp.status}`)
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = activeVersion === 'skills-first'
        ? `resume-skills-first-${selectedTemplate}.pdf`
        : `resume-${selectedTemplate}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      showToast('PDF downloaded successfully')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'PDF generation failed.', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadDocx = async () => {
    if (!displayedResumeText) return
    setIsDownloadingDocx(true)
    try {
      const blob = await downloadResumeDocx({ resumeText: displayedResumeText, template: selectedTemplate })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = activeVersion === 'skills-first'
        ? `resume-skills-first-${selectedTemplate}.docx`
        : `resume-${selectedTemplate}.docx`
      a.click()
      URL.revokeObjectURL(url)
      showToast('DOCX downloaded successfully')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'DOCX generation failed.', 'error')
    } finally {
      setIsDownloadingDocx(false)
    }
  }

  // ── Loading states ────────────────────────────────────────────────────────
  if (isLoading) {
    // Show streaming text as soon as first token arrives — no spinner ever
    return (
      <StreamingResumeView
        text={streamingText ?? ''}
        statusMessage={statusMessage ?? ''}
        originalScore={originalScore}
      />
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!result) {
    // Free user — show blurred preview + upgrade CTA
    if (!isPro) {
      return (
        <EmptyCard>
          <EmptyState icon={<IconEdit />} title="AI Resume Optimization" subtitle="Claude rewrites every bullet to maximize your ATS score without fabricating your experience." />

          {/* ── Blurred Preview ── */}
          {(previewLoading || previewBullets.length > 0) && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Preview — your optimized bullets
              </div>

              {previewLoading ? (
                /* Skeleton while Haiku generates */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[90, 75, 85].map((w, i) => (
                    <div key={i} style={{ height: 13, borderRadius: 4, width: `${w}%`, background: 'var(--surface-1)', animation: `pulse 1.5s ease-in-out ${i * 0.12}s infinite` }} />
                  ))}
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {previewBullets.map((bullet, i) => (
                    <div
                      key={i}
                      {...(i > 0 ? { 'aria-hidden': 'true' } : {})}
                      className={i > 0 ? 'preview-blurred' : undefined}
                      style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.75, marginBottom: 10, paddingLeft: 18, position: 'relative' }}
                    >
                      <span style={{ position: 'absolute', left: 0, color: 'var(--emerald)', fontWeight: 700 }}>•</span>
                      {bullet}
                    </div>
                  ))}
                  {/* Accessible description for screen readers */}
                  <span className="sr-only">
                    {previewBullets.length > 1
                      ? `${previewBullets.length - 1} more optimized bullet${previewBullets.length - 1 !== 1 ? 's' : ''} — upgrade to Pro to see your full optimization`
                      : 'Upgrade to Pro to see your full optimization'}
                  </span>
                  {/* Gradient fade into upgrade prompt */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 56,
                    background: 'linear-gradient(to bottom, transparent, var(--surface-0))',
                    pointerEvents: 'none',
                  }} />
                </div>
              )}
            </div>
          )}

          {/* ── Upgrade CTA ── */}
          <div style={{ marginTop: previewBullets.length > 0 ? 8 : 16 }}>
            <UpgradePrompt
              feature="Resume Optimizer"
              description="See your full optimization — every bullet rewritten, ATS score improved."
            />
          </div>
        </EmptyCard>
      )
    }

    // Pro user — standard empty state with run button
    return (
      <EmptyCard>
        <EmptyState icon={<IconEdit />} title="AI Resume Optimization" subtitle="Claude will rewrite your resume to maximize ATS keyword alignment without fabricating your experience." />
        <Button fullWidth size="lg" variant="secondary" disabled={!hasResume} onClick={onRun} style={{ marginTop: 16 }}>
          Optimize My Resume
        </Button>
        {originalScore !== undefined && originalScore >= 80 && (
          <div style={{
            marginTop: 10,
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: 360,
            margin: '10px auto 0',
          }}>
            Your resume already clears ATS thresholds at {originalScore}. Optimization will focus on the qualitative gaps that matter to recruiters.
          </div>
        )}
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>{error}</p>}
      </EmptyCard>
    )
  }

  // ── Results ───────────────────────────────────────────────────────────────
  const improved      = result.scoreImprovement > 0
  const scoresEqual   = result.optimizedScore === result.originalScore && result.originalScore > 0
  const hasOptimized  = result.optimizedResumeText && result.optimizedResumeText !== result.originalResumeText

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>

      {/* ── Score Delta Card ── */}
      <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 20 }}>Optimization Results</h2>
        {scoresEqual ? (
          /* ── ATS Cleared layout — Credit Karma "factors" pattern ─────────── */
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>

            {/* Left: single score ring — reframed, not a comparison */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{
                fontSize: 11, color: 'var(--success)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
              }}>
                ATS Score
              </div>
              <ScoreRing score={result.optimizedScore} size={90} label="" />
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--success)',
                marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <span>✓</span> ATS Cleared
              </div>
            </div>

            {/* Right: named improvements */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 4 }}>
                Resume refined for human reviewers
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                Keywords were already strong. Claude improved the gaps that matter once a recruiter reads it:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {addedKeywords.map(kw => (
                  <div key={kw} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 14 }}>✓</span>
                    <span style={{ color: 'var(--text-primary)' }}><strong>{kw}</strong> — added</span>
                  </div>
                ))}
                {bulletChanges > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 14 }}>✓</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      <strong>{bulletChanges} bullet{bulletChanges !== 1 ? 's' : ''}</strong> rewritten for impact and clarity
                    </span>
                  </div>
                )}
                {scanGaps.slice(0, 2).map((gap, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, marginTop: 2 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 14, marginTop: 1 }}>→</span>
                    <span style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{gap} — addressed where possible</span>
                  </div>
                ))}
                {addedKeywords.length === 0 && bulletChanges === 0 && scanGaps.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Your resume was already well-matched for this role.
                  </div>
                )}
              </div>
            </div>
          </div>

        ) : (
          /* ── Standard Before → After layout ─────────────────────────────── */
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Before</div>
              <ScoreRing score={result.originalScore} size={90} label="" />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontWeight: 500 }}>{scoreToPercentile(result.originalScore)}</div>
            </div>
            <div style={{ fontSize: 32, color: 'var(--gray-200)' }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>After</div>
              <ScoreRing score={result.optimizedScore} size={90} label="" />
              <div style={{ fontSize: 11, color: 'var(--emerald)', marginTop: 5, fontWeight: 600 }}>
                {scoreToPercentile(result.optimizedScore)}
              </div>
            </div>
            <div style={{ flex: 1, paddingLeft: 20, minWidth: 160 }}>
              {improved ? (
                <>
                  <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)' }}>+{result.scoreImprovement} points</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>ATS score improvement</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>No improvement possible</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Your resume is already well-optimized for this role.</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* "What Claude changed" chips — only shown when score improved (not in ATS Cleared layout) */}
        {!scoresEqual && (addedKeywords.length > 0 || bulletChanges > 0) && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--gray-100)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>What Claude changed</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {addedKeywords.map(kw => (
                <span key={kw} style={{ fontSize: 12, fontWeight: 600, color: 'var(--emerald)', background: 'var(--success-light)', border: '1px solid var(--emerald)', borderRadius: 999, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10 }}>+</span>{kw}
                </span>
              ))}
              {bulletChanges > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)', background: 'rgba(26,54,93,0.07)', border: '1px solid rgba(26,54,93,0.15)', borderRadius: 999, padding: '3px 10px' }}>
                  {bulletChanges} bullet{bulletChanges !== 1 ? 's' : ''} rewritten
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Resume Text + Diff ── */}
      {hasOptimized && (
        <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>Your Optimized Resume</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['optimized', 'original', 'changes'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600,
                  border: '1px solid var(--border-input)', cursor: 'pointer',
                  background: view === v ? 'var(--navy)' : 'transparent',
                  color: view === v ? 'white' : 'var(--gray-500)',
                  transition: 'all 0.12s ease',
                }}>
                  {v === 'optimized' ? 'Optimized' : v === 'original' ? 'Original' : '± Changes'}
                </button>
              ))}
            </div>
          </div>

          {view === 'changes' && lineDiff ? (
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, lineHeight: 1.75, maxHeight: 440, overflow: 'auto', padding: '12px 16px', background: 'var(--surface-1)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--gray-200)' }}>
              {lineDiff.map((line, i) => {
                if (line.type === 'same' && !line.text.trim()) return <div key={i} style={{ height: 6 }} />
                return (
                  <div key={i} style={{ padding: '1px 8px', marginLeft: -8, borderRadius: 3, background: line.type === 'add' ? 'var(--diff-add-bg)' : line.type === 'remove' ? 'var(--diff-remove-bg)' : 'transparent', color: line.type === 'add' ? 'var(--diff-add-text)' : line.type === 'remove' ? 'var(--diff-remove-text)' : 'var(--text-primary)', textDecoration: line.type === 'remove' ? 'line-through' : 'none', opacity: line.type === 'remove' ? 0.7 : 1, display: 'flex', gap: 8 }}>
                    <span style={{ width: 12, flexShrink: 0, fontWeight: 700, userSelect: 'none' }}>{line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' '}</span>
                    <span>{line.text || ' '}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, maxHeight: 400, overflow: 'auto', padding: 16, background: 'var(--surface-1)', borderRadius: 'var(--radius)' }}>
              {view === 'optimized'
                ? (activeVersion === 'skills-first' && skillsFirstText ? skillsFirstText : result.optimizedResumeText)
                : result.originalResumeText}
            </pre>
          )}

          <Button
            style={{ marginTop: 12 }} size="sm" variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(displayedResumeText)
                showToast('Copied to clipboard')
              } catch {
                showToast('Copy failed — please select and copy manually.', 'error')
              }
            }}
          >
            Copy
          </Button>
        </div>
      )}

      {/* ── Download ── */}
      {hasOptimized && (
        <div style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Download Resume</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Choose a template and download your optimized resume as PDF or DOCX.</p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
            {TEMPLATE_OPTIONS.map(t => {
              const selected = selectedTemplate === t.id
              return (
                <button key={t.id} onClick={() => setSelectedTemplate(t.id)} style={{ flex: 1, padding: '14px 10px', borderRadius: 'var(--radius)', border: `2px solid ${selected ? 'var(--navy)' : 'var(--gray-200)'}`, background: selected ? 'var(--navy)' : 'white', color: selected ? 'white' : 'var(--charcoal)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <TemplatePreview type={t.preview} selected={selected} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{t.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, color: selected ? 'rgba(255,255,255,0.9)' : 'var(--navy)', background: selected ? 'rgba(255,255,255,0.2)' : 'rgba(30,58,95,0.08)', borderRadius: 4, padding: '1px 5px' }}>{t.badge}</span>
                    </div>
                    <div style={{ fontSize: 10, color: selected ? 'rgba(255,255,255,0.65)' : 'var(--gray-400)', lineHeight: 1.4 }}>{t.description}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* ── Context hints below template row ── */}
          {selectedTemplate === 'professional' && selectedPalette === 'monochrome' && (
            <p style={{ fontSize: 11, color: 'var(--success)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
              ✓ <strong>Tech-optimized</strong> — single-column, ATS-safe format preferred for software engineering roles
            </p>
          )}
          {selectedTemplate === 'modern' && (
            <p style={{ fontSize: 11, color: 'var(--warning)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
              Two-column layouts may not parse correctly in some ATS systems. Use <button onClick={() => setSelectedTemplate('professional')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--navy)', fontWeight: 700, fontSize: 11, textDecoration: 'underline' }}>Professional</button> for guaranteed compatibility.
            </p>
          )}
          {(selectedTemplate !== 'professional' || selectedPalette !== 'monochrome') && selectedTemplate !== 'modern' && (
            <div style={{ marginBottom: 16 }} />
          )}
          {/* ── Palette picker ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Color Scheme</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {PALETTE_OPTIONS.map(p => {
                const active = selectedPalette === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPalette(p.id)}
                    title={p.label}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: p.hex,
                      border: active ? `3px solid var(--text-primary)` : '3px solid transparent',
                      boxShadow: active ? '0 0 0 1px var(--border)' : '0 0 0 1px var(--border)',
                      transition: 'border-color 0.15s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 10, color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active ? 600 : 400 }}>{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button size="md" variant="secondary" onClick={handleDownloadPDF} disabled={isDownloading} style={{ minWidth: 160 }}>
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button size="md" variant="outline" onClick={handleDownloadDocx} disabled={isDownloadingDocx} style={{ minWidth: 160 }}>
              {isDownloadingDocx ? 'Generating...' : 'Download DOCX'}
            </Button>
          </div>

          {/* ── Skills-First toggle ── */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 2px' }}>Skills-First Layout</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Restructures your resume to lead with a grouped Skills section — ideal for skills-based screening.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              <button
                onClick={handleSkillsFirstToggle}
                disabled={isLoadingSkillsFirst}
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                  background: activeVersion === 'skills-first' ? 'var(--success-light)' : 'var(--surface-1)',
                  color: activeVersion === 'skills-first' ? 'var(--success)' : 'var(--text-secondary)',
                  border: `1px solid ${activeVersion === 'skills-first' ? 'var(--success)' : 'var(--border)'}`,
                  cursor: isLoadingSkillsFirst ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isLoadingSkillsFirst
                  ? 'Generating skills-first version…'
                  : activeVersion === 'skills-first'
                    ? '✓ Skills-First Active'
                    : skillsFirstText
                      ? 'Switch to Skills-First'
                      : 'Try Skills-First Layout'}
              </button>

              {skillsFirstText && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['original', 'skills-first'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setActiveVersion(v)}
                      style={{
                        padding: '5px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6,
                        background: activeVersion === v ? 'var(--navy)' : 'var(--surface-1)',
                        color: activeVersion === v ? 'white' : 'var(--text-secondary)',
                        border: '1px solid var(--border)', cursor: 'pointer',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {v === 'original' ? 'Original' : 'Skills-First'}
                    </button>
                  ))}
                </div>
              )}

              {skillsFirstError && (
                <p style={{ fontSize: 12, color: 'var(--danger)', margin: 0 }}>{skillsFirstError}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {result.optimizationGuidance && !scoresEqual && (
        <div style={{ background: 'var(--warning-light)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid #FDE68A' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', marginBottom: 10 }}>{result.optimizationGuidance.title}</h3>
          {result.optimizationGuidance.reasons.map((r, i) => <p key={i} style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>• {r}</p>)}
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 12 }}>{result.optimizationGuidance.suggestionsTitle}</p>
          {result.optimizationGuidance.suggestions.map((s, i) => <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>→ {s}</p>)}
        </div>
      )}
    </div>
  )
}
