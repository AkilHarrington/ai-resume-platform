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
import { SummaryTab } from '../features/workspace/SummaryTab'
import ToolsTab from '../features/workspace/ToolsTab'
import { UpgradePrompt, IconSun, IconMoon } from '../features/workspace/shared'
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
  'dashboard': 1, 'scan': 2, 'optimize': 3, 'cover-letter': 4, 'linkedin': 5, 'summary': 6, 'tools': 0,
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

  const handleNewRole = useCallback(() => {
    setJobDescription('')
    setScanResult(null)
    setOptimizeResult(null)
    setOptimizedScore(null)
    setCoverLetter('')
    setLinkedin(null)
    setStreamingOptimize('')
    setOptimizeStatus('')
    setIsOptimizing(false)
    setIsStreamingCover(false)
    setIsStreamingLinkedIn(false)
    setActiveTab('dashboard')
  }, [])

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
  type Banner = { msg: string | null; btn: string | null; action: (() => void) | null; disabled: boolean; skip?: { label: string; action: () => void } }

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
      return { msg: 'Resume ready — stand out further with a tailored cover letter', btn: 'Generate Cover Letter →', action: () => setActiveTab('cover-letter'), disabled: false, skip: { label: 'Skip to Download', action: () => setActiveTab('summary') } }
    }

    if (currentStep === 4) {
      if (isStreamingCover) return { msg: 'Writing your cover letter…', btn: null, action: null, disabled: true }
      if (!coverLetter) {
        if (!isPro) return { msg: 'Cover Letter Generator is a Pro feature', btn: 'Upgrade to Pro →', action: () => navigate('/pricing'), disabled: false, skip: { label: 'Skip to Download', action: () => setActiveTab('summary') } }
        return { msg: 'AI writes a tailored, specific cover letter for this exact role', btn: 'Generate Cover Letter', action: runCoverLetter, disabled: false, skip: { label: 'Skip to Download', action: () => setActiveTab('summary') } }
      }
      return { msg: 'Almost there — optimize your LinkedIn to match this role', btn: 'Optimize LinkedIn →', action: () => setActiveTab('linkedin'), disabled: false, skip: { label: 'Skip to Download', action: () => setActiveTab('summary') } }
    }

    if (currentStep === 5) {
      if (isStreamingLinkedIn) return { msg: 'Optimizing your LinkedIn profile…', btn: null, action: null, disabled: true }
      if (!linkedin) {
        if (!isPro) return { msg: 'LinkedIn Optimizer is a Pro feature', btn: 'Upgrade to Pro →', action: () => navigate('/pricing'), disabled: false }
        return { msg: 'AI crafts a keyword-rich headline and About section', btn: 'Optimize LinkedIn', action: runLinkedIn, disabled: false }
      }
      return { msg: 'Your complete package is ready — resume, cover letter, and LinkedIn all set', btn: 'View package →', action: () => setActiveTab('summary'), disabled: false }
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
          onClick={() => setActiveTab(activeTab === 'tools' ? 'dashboard' : 'tools')}
          aria-label="Writing tools"
          style={{
            background: activeTab === 'tools' ? 'var(--navy)' : 'var(--surface-1)',
            color: activeTab === 'tools' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Tools
        </button>
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 12, lineHeight: 1 }}
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
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

          {/* Tools: writing tools (not part of step flow) */}
          {activeTab === 'tools' && (
            <ErrorBoundary tabName="Writing Tools">
              <ToolsTab resumeText={resumeText} targetRole={targetRole} />
            </ErrorBoundary>
          )}

          {/* Summary: completion page */}
          {activeTab === 'summary' && (
            <ErrorBoundary tabName="Summary">
              <SummaryTab
                scanResult={scanResult}
                optimizedScore={optimizedScore}
                optimizeResult={optimizeResult}
                coverLetter={coverLetter}
                linkedin={linkedin}
                companyName={companyName}
                resumeFileName={resumeFileName}
                onNewRole={handleNewRole}
              />
            </ErrorBoundary>
          )}

          {/* ── Footer ── */}
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</a>
              {' · '}
              <a href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</a>
              {' · '}
              © {new Date().getFullYear()} AI Resume Studio
            </p>
          </div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {banner.skip && (
              <button
                onClick={banner.skip.action}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px',
                  fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline',
                  whiteSpace: 'nowrap',
                }}
              >
                {banner.skip.label}
              </button>
            )}
            {banner.btn && (
              <button
                onClick={banner.action ?? undefined}
                disabled={banner.disabled}
                style={{
                  padding: '9px 20px',
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
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textAlign: 'center' }}>
        or paste text below
      </p>
      <textarea
        value={value}
        placeholder="Paste your resume text here…"
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
        <div style={{ textAlign: 'right', fontSize: 10, marginTop: 2, color: atLimit ? 'var(--danger)' : 'var(--text-muted)' }}>
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
  const hasJd     = jobDescription.trim().length > 0
  const hasResume = !!resumeText

  return (
    <div>

      {/* Section heading */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 4px' }}>
          {hasResume ? 'Your setup' : "Let's get started"}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
          {hasResume
            ? 'Resume loaded — add a job description to run your ATS scan'
            : 'Upload your resume and add a job description to get started'}
        </p>
      </div>

      {/* ── Resume + JD grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* ── Resume card ── */}
        <div style={{
          border: `1px ${hasResume || isUploading ? 'solid' : 'dashed'} ${hasResume ? 'var(--success)' : 'var(--border-input)'}`,
          borderRadius: 12, overflow: 'hidden',
          background: 'var(--surface-0)',
          transition: 'border-color 0.15s',
        }}>
          {/* Header row */}
          <div style={{
            padding: '9px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Resume</span>
            {isUploading && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reading…</span>
            )}
            {hasResume && !isUploading && (
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ready
              </span>
            )}
          </div>
          {/* Body */}
          <div style={{ padding: 14 }}>
            {isUploading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 64, color: 'var(--text-muted)', fontSize: 13 }}>
                Reading file…
              </div>
            ) : hasResume ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-1)', borderRadius: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, color: 'var(--success)' }} aria-hidden="true">
                    <path d="M11 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 13h6M7 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 1px' }}>
                      {resumeFileName || 'Pasted resume'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>{wordCount} words</p>
                  </div>
                </div>
                <button
                  onClick={onUploadClick}
                  style={{ background: 'none', border: 'none', padding: 0, marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M9 1.5l1.5 1.5-7 7H2V8.5l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Change
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onUploadClick}
                  style={{
                    width: '100%', background: 'none', border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 6, cursor: 'pointer', padding: '16px 0',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ color: 'var(--text-muted)' }} aria-hidden="true">
                    <path d="M11 14V4M11 4L7 8M11 4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 16v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 2px', textAlign: 'center' }}>Paste or upload resume</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>PDF, DOCX · max 5 MB</p>
                  </div>
                </button>
                <PasteResumeArea onPasteResume={onPasteResume} />
              </>
            )}
          </div>
        </div>

        {/* ── Job description card ── */}
        <div style={{
          border: `1px ${hasJd ? 'solid' : 'dashed'} ${hasJd ? 'var(--success)' : 'var(--border-input)'}`,
          borderRadius: 12, overflow: 'hidden',
          background: 'var(--surface-0)',
          transition: 'border-color 0.15s',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header row */}
          <div style={{
            padding: '9px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Job description</span>
            <span style={{ fontSize: 11, color: jobDescription.length > MAX_JD_CHARS * 0.9 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {jobDescription.length.toLocaleString()} / {MAX_JD_CHARS.toLocaleString()}
            </span>
          </div>
          {/* Textarea */}
          <textarea
            value={jobDescription}
            onChange={e => onJDChange(e.target.value)}
            maxLength={MAX_JD_CHARS}
            placeholder={'Paste from LinkedIn, Indeed, or the company site…\n\nEnables ATS keyword scoring and tailored optimization'}
            rows={7}
            style={{
              flex: 1, width: '100%', border: 'none', outline: 'none', background: 'transparent',
              padding: '12px 14px', fontSize: 12, color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)', lineHeight: 1.5, resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

      </div>

      {/* ── Job context card (always visible) ── */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6.5 5.5v4M6.5 4h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Job context (optional) — improves cover letter and LinkedIn output
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 4px' }}>Company name</p>
            <input
              type="text"
              value={companyName}
              onChange={e => onCompanyChange(e.target.value)}
              placeholder="e.g. Google, Stripe…"
              style={{
                width: '100%', padding: '7px 10px', fontSize: 12,
                border: '1px solid var(--border-input)', borderRadius: 8,
                background: 'var(--surface-0)', color: 'var(--text-primary)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 4px' }}>Target role</p>
            <input
              type="text"
              value={targetRole}
              onChange={e => onTargetRoleChange(e.target.value)}
              placeholder="e.g. Senior Engineer…"
              style={{
                width: '100%', padding: '7px 10px', fontSize: 12,
                border: '1px solid var(--border-input)', borderRadius: 8,
                background: 'var(--surface-0)', color: 'var(--text-primary)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
