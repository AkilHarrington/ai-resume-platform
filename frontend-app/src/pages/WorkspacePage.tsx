import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useToast } from '../components/Toast'
import { ScanTab } from '../features/workspace/ScanTab'
import { OptimizeTab } from '../features/workspace/OptimizeTab'
import { CoverLetterTab } from '../features/workspace/CoverLetterTab'
import { LinkedInTab } from '../features/workspace/LinkedInTab'
import { UpgradePrompt } from '../features/workspace/shared'
import type { Tab } from '../features/workspace/shared'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../app/ThemeContext'
import {
  uploadResume, scanResume, streamOptimize,
  streamCoverLetter, streamLinkedIn, getProStatus,
  type ScanResult, type OptimizeResult,
} from '../api/resumeApi'

const MAX_RESUME_CHARS = 50_000
const MAX_JD_CHARS    = 30_000

const STEPS: { id: Tab; label: string; short: string }[] = [
  { id: 'dashboard',    label: 'Upload',       short: 'Upload' },
  { id: 'scan',         label: 'ATS Scan',     short: 'Scan'   },
  { id: 'optimize',     label: 'Optimize',     short: 'Opt.'   },
  { id: 'cover-letter', label: 'Cover Letter', short: 'Cover'  },
  { id: 'linkedin',     label: 'LinkedIn',     short: 'LinkedIn' },
]

const TAB_TO_STEP: Record<Tab, number> = {
  'dashboard': 1, 'scan': 2, 'optimize': 3, 'cover-letter': 4, 'linkedin': 5,
}

// ── Component ─────────────────────────────────────────────────────────────────
export function WorkspacePage() {
  const navigate   = useNavigate()
  const { user, signOut, loading } = useAuth()
  const isMobile   = useIsMobile()
  const { showToast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Core state ────────────────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState<Tab>('dashboard')
  const [resumeText,     setResumeText]     = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [companyName,    setCompanyName]    = useState('')
  const [targetRole,     setTargetRole]     = useState('')

  const [scanResult,     setScanResult]     = useState<ScanResult | null>(null)

  const [optimizeResult,       setOptimizeResult]       = useState<OptimizeResult | null>(null)
  const [optimizedScore,       setOptimizedScore]       = useState<number | null>(null)
  const [isOptimizing,         setIsOptimizing]         = useState(false)
  const [optimizeError,        setOptimizeError]        = useState('')
  const [streamingOptimize,    setStreamingOptimize]    = useState('')
  const [optimizeStatus,       setOptimizeStatus]       = useState('')

  const [coverLetter,      setCoverLetter]      = useState('')
  const [isStreamingCover, setIsStreamingCover] = useState(false)
  const [coverError,       setCoverError]       = useState('')

  const [linkedin,             setLinkedin]             = useState<{ headline: string; summary: string } | null>(null)
  const [isStreamingLinkedIn,  setIsStreamingLinkedIn]  = useState(false)
  const [linkedinError,        setLinkedinError]        = useState('')

  // ── Auth redirect ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [loading, user, navigate])

  // ── Pro status ────────────────────────────────────────────────────────────
  const proQuery = useQuery({
    queryKey: ['pro-status', user?.id],
    queryFn:  () => getProStatus(),
    staleTime: 60_000,
    enabled:  !!user,
  })
  const isPro = proQuery.data?.isPro ?? false

  // ── Upload ────────────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: (data) => {
      setResumeText(data.resumeText)
      // Reset downstream results on new upload
      setScanResult(null)
      setOptimizeResult(null)
      setOptimizedScore(null)
      setCoverLetter('')
      setLinkedin(null)
      showToast('Resume uploaded')
    },
    onError: (err: Error) => {
      showToast(
        err.message.includes('413')         ? 'File too large. Maximum size is 5 MB.'
        : err.message.includes('timed out') ? err.message
        : 'Could not read that file. Try PDF, DOCX, or paste text directly.',
        'error'
      )
    },
  })

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResumeFileName(file.name)
    uploadMutation.mutate(file)
    e.target.value = ''
  }, [uploadMutation])

  // ── Scan ──────────────────────────────────────────────────────────────────
  const scanMutation = useMutation({
    mutationFn: () => scanResume(resumeText, jobDescription || undefined),
    onSuccess: (data) => {
      setScanResult(data)
      setActiveTab('scan')
    },
  })

  // ── Optimize ──────────────────────────────────────────────────────────────
  const runOptimize = useCallback(async () => {
    setIsOptimizing(true)
    setOptimizeError('')
    setStreamingOptimize('')
    setOptimizeStatus('')
    await streamOptimize(
      {
        resumeText,
        jobDescription:   jobDescription || undefined,
        existingScore:    scanResult?.overallScore ?? undefined,
        existingKeywords: scanResult?.missingKeywords ?? undefined,
      },
      (msg)   => setOptimizeStatus(msg),
      (chunk) => setStreamingOptimize(prev => prev + chunk),
      (result) => {
        setOptimizeResult(result)
        setOptimizedScore(result.optimizedScore)
        setStreamingOptimize('')
        setOptimizeStatus('')
      },
      () => setIsOptimizing(false),
      (msg) => { setOptimizeError(msg); setIsOptimizing(false); setStreamingOptimize(''); setOptimizeStatus('') },
    )
  }, [resumeText, jobDescription, scanResult])

  // ── Cover letter ──────────────────────────────────────────────────────────
  const runCoverLetter = useCallback(async () => {
    setCoverLetter('')
    setCoverError('')
    setIsStreamingCover(true)
    await streamCoverLetter(
      { resumeText, jobDescription: jobDescription || undefined, companyName: companyName || undefined },
      (chunk) => setCoverLetter(prev => prev + chunk),
      ()      => setIsStreamingCover(false),
      (msg)   => { setCoverError(msg); setIsStreamingCover(false) },
    )
  }, [resumeText, jobDescription, companyName])

  // ── LinkedIn ──────────────────────────────────────────────────────────────
  const runLinkedIn = useCallback(async () => {
    setLinkedin(null)
    setLinkedinError('')
    setIsStreamingLinkedIn(true)
    let raw = ''
    await streamLinkedIn(
      { resumeText, jobDescription: jobDescription || undefined, targetRole: targetRole || undefined },
      (chunk) => {
        raw += chunk
        if (raw.includes('SUMMARY:')) {
          const idx = raw.indexOf('SUMMARY:')
          setLinkedin({
            headline: raw.slice(0, idx).replace('HEADLINE:', '').trim(),
            summary:  raw.slice(idx + 'SUMMARY:'.length).trim(),
          })
        } else {
          setLinkedin({ headline: raw.replace('HEADLINE:', '').trim(), summary: '' })
        }
      },
      ()    => setIsStreamingLinkedIn(false),
      (msg) => { setLinkedinError(msg); setIsStreamingLinkedIn(false) },
    )
  }, [resumeText, jobDescription, targetRole])

  // ── Early return ──────────────────────────────────────────────────────────
  if (loading || !user) return null

  const scanError   = (scanMutation.error as Error)?.message || ''
  const wordCount   = resumeText.split(/\s+/).filter(Boolean).length
  const currentStep = TAB_TO_STEP[activeTab]

  // Step completion
  const done: Record<number, boolean> = {
    1: !!resumeText,
    2: !!scanResult,
    3: !!optimizeResult,
    4: !!coverLetter,
    5: !!linkedin,
  }

  // ── Next banner config ────────────────────────────────────────────────────
  type Banner = { msg: string | null; btn: string | null; action: (() => void) | null; disabled: boolean }

  const getBanner = (): Banner => {
    if (!resumeText) return {
      msg: 'Upload your resume to get started',
      btn: uploadMutation.isPending ? 'Uploading…' : 'Upload Resume',
      action: () => fileInputRef.current?.click(),
      disabled: uploadMutation.isPending,
    }

    if (currentStep === 1) {
      if (scanMutation.isPending) return { msg: 'Scanning your resume…', btn: null, action: null, disabled: true }
      if (!jobDescription) return { msg: 'Paste a job description to unlock ATS scoring', btn: 'Run ATS Scan', action: null, disabled: true }
      return { msg: 'Ready — analyze your match rate against this role', btn: 'Run ATS Scan →', action: () => { setActiveTab('scan'); scanMutation.mutate() }, disabled: false }
    }

    if (currentStep === 2) {
      if (scanMutation.isPending) return { msg: 'Scanning your resume…', btn: null, action: null, disabled: true }
      if (!scanResult) return { msg: null, btn: null, action: null, disabled: true }
      const score = scanResult.overallScore ?? 0
      const optimizeMsg = score >= 80
        ? `Score of ${score} — AI can fine-tune your keyword alignment for this role`
        : score >= 60
          ? `Score of ${score} — AI can strengthen your keyword match for this role`
          : `Score of ${score} — AI can rewrite your bullets to better match this role`
      return { msg: optimizeMsg, btn: 'Optimize Resume →', action: () => { setActiveTab('optimize'); if (!optimizeResult && !isOptimizing) runOptimize() }, disabled: false }
    }

    if (currentStep === 3) {
      if (isOptimizing) return { msg: 'Optimizing your resume…', btn: null, action: null, disabled: true }
      if (!optimizeResult) {
        if (!isPro) return { msg: 'Resume Optimizer is a Pro feature', btn: 'Upgrade to Pro →', action: () => navigate('/pricing'), disabled: false }
        return { msg: 'AI rewrites every bullet to maximize your ATS match', btn: 'Optimize Now', action: runOptimize, disabled: false }
      }
      return { msg: 'Resume ready — stand out further with a tailored cover letter', btn: 'Generate Cover Letter →', action: () => setActiveTab('cover-letter'), disabled: false }
    }

    if (currentStep === 4) {
      if (isStreamingCover) return { msg: 'Writing your cover letter…', btn: null, action: null, disabled: true }
      if (!coverLetter) {
        if (!isPro) return { msg: 'Cover Letter Generator is a Pro feature', btn: 'Upgrade to Pro →', action: () => navigate('/pricing'), disabled: false }
        return { msg: 'AI writes a tailored, specific cover letter for this exact role', btn: 'Generate Cover Letter', action: runCoverLetter, disabled: false }
      }
      return { msg: 'Almost there — optimize your LinkedIn to match this role', btn: 'Optimize LinkedIn →', action: () => setActiveTab('linkedin'), disabled: false }
    }

    if (currentStep === 5) {
      if (isStreamingLinkedIn) return { msg: 'Optimizing your LinkedIn profile…', btn: null, action: null, disabled: true }
      if (!linkedin) {
        if (!isPro) return { msg: 'LinkedIn Optimizer is a Pro feature', btn: 'Upgrade to Pro →', action: () => navigate('/pricing'), disabled: false }
        return { msg: 'AI crafts a keyword-rich headline and About section', btn: 'Optimize LinkedIn', action: runLinkedIn, disabled: false }
      }
      return { msg: '🎉 Your complete application package is ready', btn: null, action: null, disabled: true }
    }

    return { msg: null, btn: null, action: null, disabled: true }
  }

  const banner = getBanner()

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--surface-page)' }}>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* ── Nav row ────────────────────────────────────────────────────────── */}
      <header style={{
        height: 44, flexShrink: 0,
        background: 'var(--surface-0)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10,
      }}>
        <button
          onClick={() => navigate('/')}
          aria-label="AI Resume Studio — go to homepage"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}
        >
          {/* Logo icon */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <rect width="28" height="28" rx="6" fill="#1E3A5F"/>
            <rect x="7" y="7" width="14" height="3" rx="1" fill="white" opacity="0.9"/>
            <rect x="7" y="12" width="10" height="2" rx="1" fill="white" opacity="0.7"/>
            <rect x="7" y="16" width="12" height="2" rx="1" fill="white" opacity="0.7"/>
            <circle cx="21" cy="21" r="5" fill="#047857"/>
            <path d="M18.5 21L20.2 22.8L23.5 19.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
            <span style={{ fontWeight: 900, fontSize: 12, color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>AI Resume</span>
            <span style={{ fontWeight: 800, fontSize: 9, color: 'var(--success)', letterSpacing: '0.08em' }}>STUDIO</span>
          </div>
        </button>
        {isPro && (
          <span style={{ fontSize: 9, fontWeight: 800, background: 'var(--success-light)', color: 'var(--success)', padding: '2px 7px', borderRadius: 999, letterSpacing: '0.04em' }}>
            PRO
          </span>
        )}
        {!isMobile && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</span>
        )}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 12, lineHeight: 1 }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={() => { signOut(); navigate('/') }}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </header>

      {/* ── Step indicator bar ─────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, background: 'var(--surface-0)', borderBottom: '1px solid var(--border)', padding: '12px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', maxWidth: 600, margin: '0 auto' }}>
          {STEPS.map((step, i) => {
            const stepNum  = i + 1
            const isDone   = done[stepNum]
            const isActive = currentStep === stepNum
            const stepItems = [
              <div key={`step-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <button
                  onClick={() => setActiveTab(step.id)}
                  aria-label={`Step ${stepNum}: ${step.label}`}
                  aria-current={isActive ? 'step' : undefined}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: isDone ? 'var(--success-light)' : isActive ? 'var(--navy)' : 'var(--surface-1)',
                    color: isDone ? 'var(--success)' : isActive ? 'white' : 'var(--text-muted)',
                    outline: isActive ? '2px solid var(--navy)' : 'none',
                    outlineOffset: 2,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {isDone ? '✓' : stepNum}
                </button>
                {!isMobile && (
                  <div style={{
                    fontSize: 10, marginTop: 4, whiteSpace: 'nowrap', textAlign: 'center',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>
                    {step.label}
                  </div>
                )}
              </div>
            ]
            if (i < STEPS.length - 1) {
              stepItems.push(
                <div key={`line-${i}`} style={{
                  flex: 1, height: 1, margin: '15px 5px 0', minWidth: 8,
                  background: done[stepNum] ? 'var(--success)' : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              )
            }
            return stepItems
          })}
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', padding: isMobile ? '16px 12px 80px' : '24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* Step 1: Upload + JD setup */}
          {activeTab === 'dashboard' && (
            <SetupStep
              resumeText={resumeText}
              resumeFileName={resumeFileName}
              jobDescription={jobDescription}
              companyName={companyName}
              targetRole={targetRole}
              isUploading={uploadMutation.isPending}
              wordCount={wordCount}
              isMobile={isMobile}
              onUploadClick={() => fileInputRef.current?.click()}
              onJDChange={(v) => setJobDescription(v.slice(0, MAX_JD_CHARS))}
              onCompanyChange={setCompanyName}
              onTargetRoleChange={setTargetRole}
              onPasteResume={(text) => {
                setResumeText(text.slice(0, MAX_RESUME_CHARS))
                setResumeFileName('Pasted resume')
              }}
            />
          )}

          {/* Step 2: ATS Scan */}
          {activeTab === 'scan' && (
            <ErrorBoundary tabName="ATS Scanner">
              <ScanTab
                result={scanResult}
                isLoading={scanMutation.isPending}
                hasResume={!!resumeText}
                isPro={isPro}
                error={scanError}
                optimizedScore={optimizedScore}
              />
            </ErrorBoundary>
          )}

          {/* Step 3: Optimize */}
          {activeTab === 'optimize' && (
            isPro
              ? <ErrorBoundary tabName="Resume Optimizer">
                  <OptimizeTab
                    result={optimizeResult}
                    isLoading={isOptimizing}
                    hasResume={!!resumeText}
                    onRun={runOptimize}
                    error={optimizeError}
                    streamingText={streamingOptimize}
                    statusMessage={optimizeStatus}
                    originalScore={scanResult?.overallScore ?? undefined}
                  />
                </ErrorBoundary>
              : <UpgradePrompt
                  feature="Resume Optimizer"
                  description="Claude rewrites your resume to maximize ATS alignment with your target job description."
                />
          )}

          {/* Step 4: Cover Letter */}
          {activeTab === 'cover-letter' && (
            isPro
              ? <ErrorBoundary tabName="Cover Letter">
                  <CoverLetterTab
                    result={coverLetter}
                    isLoading={isStreamingCover && !coverLetter}
                    isStreaming={isStreamingCover}
                    hasResume={!!resumeText}
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                    onRun={runCoverLetter}
                    error={coverError}
                  />
                </ErrorBoundary>
              : <UpgradePrompt
                  feature="Cover Letter Generator"
                  description="Claude writes a tailored, professional cover letter based on your resume and job description."
                />
          )}

          {/* Step 5: LinkedIn */}
          {activeTab === 'linkedin' && (
            isPro
              ? <ErrorBoundary tabName="LinkedIn Optimizer">
                  <LinkedInTab
                    result={linkedin}
                    isLoading={isStreamingLinkedIn && !linkedin}
                    isStreaming={isStreamingLinkedIn}
                    hasResume={!!resumeText}
                    targetRole={targetRole}
                    setTargetRole={setTargetRole}
                    onRun={runLinkedIn}
                    error={linkedinError}
                  />
                </ErrorBoundary>
              : <UpgradePrompt
                  feature="LinkedIn Optimizer"
                  description="Claude crafts a keyword-rich headline and summary optimized for your target role."
                />
          )}

        </div>
      </main>

      {/* ── Next banner ─────────────────────────────────────────────────────── */}
      {banner.msg && (
        <div style={{
          flexShrink: 0, borderTop: '1px solid var(--border)',
          background: 'var(--surface-0)',
          padding: isMobile ? '10px 12px' : '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{banner.msg}</div>
          {banner.btn && (
            <button
              onClick={banner.action ?? undefined}
              disabled={banner.disabled}
              style={{
                flexShrink: 0, padding: '9px 20px',
                background: banner.disabled ? 'var(--surface-1)' : 'var(--navy)',
                color: banner.disabled ? 'var(--text-muted)' : 'white',
                border: banner.disabled ? '1px solid var(--border)' : 'none',
                borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: banner.disabled ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
            >
              {banner.btn}
            </button>
          )}
        </div>
      )}

      {/* ── Mobile bottom step bar ───────────────────────────────────────────── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'var(--surface-0)', borderTop: '1px solid var(--border)',
          display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {STEPS.map((step, i) => {
            const stepNum  = i + 1
            const isDone   = done[stepNum]
            const isActive = currentStep === stepNum
            return (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.id)}
                style={{
                  flex: 1, padding: '8px 2px 10px', border: 'none', cursor: 'pointer',
                  background: 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  color: isActive ? 'var(--navy)' : isDone ? 'var(--success)' : 'var(--text-muted)',
                  transition: 'color 0.12s',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1 }}>{isDone ? '✓' : stepNum}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.02em' }}>{step.short}</span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

// ── PasteResumeArea ───────────────────────────────────────────────────────────
function PasteResumeArea({ onPasteResume }: { onPasteResume: (text: string) => void }) {
  const [value, setValue] = useState('')
  const atLimit = value.length >= MAX_RESUME_CHARS
  return (
    <div style={{ marginTop: 8 }}>
      <textarea
        value={value}
        placeholder="Or paste your resume text here…"
        maxLength={MAX_RESUME_CHARS}
        rows={3}
        onChange={e => {
          const v = e.target.value.slice(0, MAX_RESUME_CHARS)
          setValue(v)
          if (v) onPasteResume(v)
        }}
        style={{
          width: '100%', padding: '8px 12px', fontSize: 12,
          border: `1px dashed ${atLimit ? 'var(--danger)' : 'var(--border-input)'}`,
          borderRadius: 8, background: 'var(--surface-1)', color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)', lineHeight: 1.5, resize: 'none',
          boxSizing: 'border-box', outline: 'none',
        }}
      />
      {value.length > 0 && (
        <div style={{
          textAlign: 'right', fontSize: 10, marginTop: 2,
          color: atLimit ? 'var(--danger)' : 'var(--text-muted)',
        }}>
          {value.length.toLocaleString()} / {MAX_RESUME_CHARS.toLocaleString()}
        </div>
      )}
    </div>
  )
}

// ── SetupStep (Step 1) ────────────────────────────────────────────────────────
interface SetupStepProps {
  resumeText: string
  resumeFileName: string
  jobDescription: string
  companyName: string
  targetRole: string
  isUploading: boolean
  wordCount: number
  isMobile: boolean
  onUploadClick: () => void
  onJDChange: (v: string) => void
  onCompanyChange: (v: string) => void
  onTargetRoleChange: (v: string) => void
  onPasteResume: (text: string) => void
}

function SetupStep({
  resumeText, resumeFileName, jobDescription, companyName, targetRole,
  isUploading, wordCount, isMobile,
  onUploadClick, onJDChange, onCompanyChange, onTargetRoleChange, onPasteResume,
}: SetupStepProps) {
  const hasJd = jobDescription.trim().length > 0

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
          {resumeText ? 'Your setup' : 'Let\'s get started'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '6px 0 0' }}>
          {resumeText
            ? 'Resume loaded — add a job description to enable ATS scoring'
            : 'Upload your resume and paste a job description to begin'}
        </p>
      </div>

      {/* ── Resume + JD grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Resume zone */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Resume
          </div>
          <button
            onClick={onUploadClick}
            disabled={isUploading}
            style={{
              width: '100%', minHeight: 152,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: resumeText ? 'var(--success-light)' : 'var(--surface-1)',
              border: `1px ${resumeText ? 'solid var(--success)' : 'dashed var(--border-input)'}`,
              borderRadius: 12, cursor: isUploading ? 'default' : 'pointer',
              textAlign: 'center', padding: 16, transition: 'background 0.15s',
            }}
          >
            {isUploading ? (
              <>
                <span style={{ fontSize: 24 }}>⏳</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Reading file…</span>
              </>
            ) : resumeText ? (
              <>
                <span style={{ fontSize: 22 }}>✅</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>{resumeFileName || 'Resume loaded'}</div>
                <div style={{ fontSize: 11, color: 'var(--success)' }}>{wordCount} words · click to change</div>
              </>
            ) : (
              <>
                <span style={{ fontSize: 26, color: 'var(--text-muted)' }}>⬆</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Upload Resume</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF or DOCX · max 5 MB</div>
              </>
            )}
          </button>
          {!resumeText && !isUploading && (
            <PasteResumeArea onPasteResume={onPasteResume} />
          )}
        </div>

        {/* JD zone */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Job Description
          </div>
          <div style={{
            border: `1px solid ${hasJd ? 'var(--success)' : 'var(--border-input)'}`,
            borderRadius: 12, overflow: 'hidden',
            background: hasJd ? 'var(--success-light)' : 'var(--surface-1)',
            transition: 'border-color 0.15s, background 0.15s',
          }}>
            <textarea
              value={jobDescription}
              onChange={e => onJDChange(e.target.value)}
              maxLength={MAX_JD_CHARS}
              placeholder={'Paste the full job description here…\n\nEnables ATS keyword scoring and tailored optimization'}
              rows={7}
              style={{
                width: '100%', border: 'none', outline: 'none', background: 'transparent',
                padding: '12px 14px', fontSize: 12, color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)', lineHeight: 1.5, resize: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{
              display: 'flex', justifyContent: 'flex-end',
              padding: '2px 10px 6px', fontSize: 10,
              color: jobDescription.length > MAX_JD_CHARS * 0.9 ? 'var(--danger)' : 'var(--text-muted)',
            }}>
              {jobDescription.length.toLocaleString()} / {MAX_JD_CHARS.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Optional fields (shown once user has either resume or JD) ── */}
      {(hasJd || resumeText) && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
              Company name <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — used in cover letter)</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => onCompanyChange(e.target.value)}
              placeholder="e.g. TechCorp"
              style={{
                width: '100%', padding: '8px 12px', fontSize: 13,
                border: '1px solid var(--border-input)', borderRadius: 8,
                background: 'var(--surface-1)', color: 'var(--text-primary)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
              Target role <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — for LinkedIn)</span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={e => onTargetRoleChange(e.target.value)}
              placeholder="e.g. Senior Operations Director"
              style={{
                width: '100%', padding: '8px 12px', fontSize: 13,
                border: '1px solid var(--border-input)', borderRadius: 8,
                background: 'var(--surface-1)', color: 'var(--text-primary)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
