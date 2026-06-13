import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useToast } from '../components/Toast'
import { ScanTab } from '../features/workspace/ScanTab'
import { OptimizeTab } from '../features/workspace/OptimizeTab'
import { CoverLetterTab } from '../features/workspace/CoverLetterTab'
import { LinkedInTab } from '../features/workspace/LinkedInTab'
import { UpgradePrompt } from '../features/workspace/shared'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  uploadResume, scanResume, optimizeResume,
  streamCoverLetter, streamLinkedIn, getProStatus,
  type ScanResult, type OptimizeResult,
} from '../api/resumeApi'

type Tab = 'scan' | 'optimize' | 'cover-letter' | 'linkedin'

const TABS: { id: Tab; label: string; icon: string; pro?: boolean }[] = [
  { id: 'scan',         label: 'ATS Scan',     icon: '🎯' },
  { id: 'optimize',     label: 'Optimize',     icon: '✨', pro: true },
  { id: 'cover-letter', label: 'Cover Letter', icon: '📝', pro: true },
  { id: 'linkedin',     label: 'LinkedIn',     icon: '💼', pro: true },
]

export function WorkspacePage() {
  const navigate = useNavigate()
  const { user, signOut, loading } = useAuth()
  const isMobile = useIsMobile()
  const { showToast } = useToast()

  // All hooks must be declared before any conditional return (Rules of Hooks).
  // The redirect lives in useEffect so hooks are always called in the same order.
  const [activeTab, setActiveTab]           = useState<Tab>('scan')
  const [resumeText, setResumeText]         = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [companyName, setCompanyName]       = useState('')
  const [targetRole, setTargetRole]         = useState('')
  const [scanResult, setScanResult]           = useState<ScanResult | null>(null)
  const [optimizeResult, setOptimizeResult]   = useState<OptimizeResult | null>(null)
  const [optimizedScore, setOptimizedScore]   = useState<number | null>(null)
  const [coverLetter, setCoverLetter]         = useState('')
  const [isStreamingCover, setIsStreamingCover] = useState(false)
  const [coverError, setCoverError]           = useState('')
  const [linkedin, setLinkedin]               = useState<{ headline: string; summary: string } | null>(null)
  const [isStreamingLinkedIn, setIsStreamingLinkedIn] = useState(false)
  const [linkedinError, setLinkedinError]     = useState('')
  const [uploadError, setUploadError]         = useState('')
  const [inputExpanded, setInputExpanded]     = useState(true)

  // Redirect unauthenticated users — inside useEffect so all hooks run unconditionally.
  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [loading, user, navigate])

  // Only fetch pro status once the user session is confirmed — prevents a spurious
  // 401 "Session expired" error on first load before auth has resolved.
  const proQuery = useQuery({
    queryKey: ['pro-status', user?.id],
    queryFn: () => getProStatus(),
    staleTime: 60_000,
    enabled: !!user,
  })
  const isPro = proQuery.data?.isPro ?? false

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: (data) => { setResumeText(data.resumeText); setUploadError(''); showToast('Resume uploaded successfully'); if (isMobile) setInputExpanded(false) },
    onError: (err: Error) => setUploadError(
      err.message.includes('413')
        ? 'File too large. Maximum size is 5 MB.'
        : err.message.includes('timed out')
          ? err.message
          : 'Could not read that file. Please try PDF, DOCX, or paste your resume text directly.'
    ),
  })

  const scanMutation     = useMutation({
    mutationFn: () => scanResume(resumeText, jobDescription || undefined),
    onSuccess: (data) => { setScanResult(data); setActiveTab('scan'); if (isMobile) setInputExpanded(false) },
  })
  const optimizeMutation = useMutation({
    mutationFn: () => optimizeResume(resumeText, jobDescription || undefined),
    onSuccess: (data) => { setOptimizeResult(data); setOptimizedScore(data.optimizedScore) },
  })
  const runCoverLetter = useCallback(async () => {
    setCoverLetter('')
    setCoverError('')
    setIsStreamingCover(true)
    await streamCoverLetter(
      { resumeText, jobDescription: jobDescription || undefined, companyName: companyName || undefined },
      (chunk) => setCoverLetter(prev => prev + chunk),
      () => setIsStreamingCover(false),
      (msg) => { setCoverError(msg); setIsStreamingCover(false) },
    )
  }, [resumeText, jobDescription, companyName])

  const runLinkedIn = useCallback(async () => {
    setLinkedin(null)
    setLinkedinError('')
    setIsStreamingLinkedIn(true)
    let raw = ''
    await streamLinkedIn(
      { resumeText, jobDescription: jobDescription || undefined, targetRole: targetRole || undefined },
      (chunk) => {
        raw += chunk
        // Parse HEADLINE:/SUMMARY: structure progressively
        if (raw.includes('SUMMARY:')) {
          const summaryIdx = raw.indexOf('SUMMARY:')
          setLinkedin({
            headline: raw.slice(0, summaryIdx).replace('HEADLINE:', '').trim(),
            summary: raw.slice(summaryIdx + 'SUMMARY:'.length).trim(),
          })
        } else {
          setLinkedin({ headline: raw.replace('HEADLINE:', '').trim(), summary: '' })
        }
      },
      () => setIsStreamingLinkedIn(false),
      (msg) => { setLinkedinError(msg); setIsStreamingLinkedIn(false) },
    )
  }, [resumeText, jobDescription, targetRole])

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) uploadMutation.mutate(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  })

  // Render nothing while auth is loading or user is being redirected to /login
  if (loading || !user) return null

  const scanError = (scanMutation.error as Error)?.message || ''

  // ─── Input Panel ─────────────────────────────────────────────────────────────
  const inputPanel = (
    <div style={{
      width: isMobile ? '100%' : 380,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      marginRight: isMobile ? 0 : 20,
    }}>

      {/* Mobile collapse toggle */}
      {isMobile && (
        <button
          onClick={() => setInputExpanded(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'white', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-lg)',
            padding: '12px 16px', cursor: 'pointer', width: '100%',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
            {resumeText ? `📄 Resume loaded (${resumeText.split(/\s+/).length} words)` : '📄 Upload your resume'}
          </span>
          <span style={{ color: 'var(--gray-400)', fontSize: 18, lineHeight: 1 }}>{inputExpanded ? '▲' : '▼'}</span>
        </button>
      )}

      {/* Collapsible body (always visible on desktop) */}
      {(!isMobile || inputExpanded) && (
        <>
          {/* Upload Zone */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>
              Your Resume
            </label>
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? 'var(--emerald)' : 'var(--gray-200)'}`,
                borderRadius: 'var(--radius)', padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                background: isDragActive ? 'var(--success-light)' : 'var(--gray-50)',
                transition: 'all var(--transition)', marginBottom: 12,
              }}
            >
              <input {...getInputProps()} />
              {uploadMutation.isPending ? (
                <div style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                  <div style={{ width: 20, height: 20, border: '2px solid var(--emerald)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
                  Reading your file...
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>Drop resume here</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>PDF, DOCX, or TXT · or click to browse</div>
                </>
              )}
            </div>
            {uploadError && <p style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{uploadError}</p>}
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 8, textAlign: 'center' }}>— or paste below —</div>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              style={{
                width: '100%', minHeight: 140, padding: '10px 12px', fontSize: 13,
                border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', resize: 'vertical',
                fontFamily: 'var(--font-sans)', lineHeight: 1.5, color: 'var(--charcoal)',
                background: resumeText ? 'white' : 'var(--gray-50)',
                boxSizing: 'border-box',
              }}
            />
            {resumeText && (
              <p style={{ fontSize: 11, color: 'var(--success)', marginTop: 6, fontWeight: 600 }}>
                ✓ {resumeText.split(/\s+/).length} words loaded
              </p>
            )}
          </div>

          {/* Job Description */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>
              Job Description <span style={{ color: 'var(--gray-300)', fontWeight: 400, textTransform: 'none' }}>(optional but recommended)</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the job description here for a more accurate ATS score..."
              style={{
                width: '100%', minHeight: 120, padding: '10px 12px', fontSize: 13,
                border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', resize: 'vertical',
                fontFamily: 'var(--font-sans)', lineHeight: 1.5, color: 'var(--charcoal)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Scan Button */}
          <Button
            fullWidth size="lg" variant="secondary"
            disabled={!resumeText.trim()}
            loading={scanMutation.isPending}
            onClick={() => scanMutation.mutate()}
          >
            {scanMutation.isPending ? 'Analyzing...' : '🎯 Run ATS Scan'}
          </Button>

          {scanError && (
            <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{scanError}</p>
          )}
        </>
      )}
    </div>
  )

  // ─── Tab Bar ─────────────────────────────────────────────────────────────────
  const tabBar = (
    <div style={{
      display: 'flex', gap: 4, background: 'white',
      borderRadius: 'var(--radius-lg)', padding: 6,
      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)',
    }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            flex: 1, padding: isMobile ? '10px 0' : '8px 0',
            borderRadius: 'var(--radius)',
            fontSize: isMobile ? 11 : 13,
            fontWeight: 600, border: 'none', cursor: 'pointer',
            background: activeTab === tab.id ? 'var(--navy)' : 'transparent',
            color: activeTab === tab.id ? 'white' : 'var(--gray-500)',
            transition: 'all var(--transition)', position: 'relative',
            lineHeight: 1.3,
          }}
        >
          <div>{tab.icon}</div>
          {!isMobile && <span>{tab.label}</span>}
          {isMobile && <div style={{ fontSize: 10, marginTop: 2 }}>{tab.label.replace('Cover Letter', 'Cover').replace('ATS Scan', 'Scan')}</div>}
          {tab.pro && !isMobile && (
            <span style={{
              position: 'absolute', top: 2, right: 6,
              background: 'var(--emerald)', color: 'white',
              fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 999, letterSpacing: '0.04em',
            }}>PRO</span>
          )}
        </button>
      ))}
    </div>
  )

  // ─── Tab Content ─────────────────────────────────────────────────────────────
  const tabContent = (
    <>
      {activeTab === 'scan' && (
        <ErrorBoundary tabName="ATS Scanner">
          <ScanTab result={scanResult} isLoading={scanMutation.isPending} hasResume={!!resumeText} isPro={isPro} error={scanError} optimizedScore={optimizedScore} />
        </ErrorBoundary>
      )}
      {activeTab === 'optimize' && (
        isPro
          ? <ErrorBoundary tabName="Resume Optimizer">
              <OptimizeTab result={optimizeResult} isLoading={optimizeMutation.isPending} hasResume={!!resumeText} onRun={() => optimizeMutation.mutate()} error={(optimizeMutation.error as Error)?.message || ''} />
            </ErrorBoundary>
          : <UpgradePrompt feature="Resume Optimizer" description="Claude rewrites your resume to maximize ATS alignment with your target job description." />
      )}
      {activeTab === 'cover-letter' && (
        isPro
          ? <ErrorBoundary tabName="Cover Letter">
              <CoverLetterTab result={coverLetter} isLoading={isStreamingCover && !coverLetter} isStreaming={isStreamingCover} hasResume={!!resumeText} companyName={companyName} setCompanyName={setCompanyName} onRun={runCoverLetter} error={coverError} />
            </ErrorBoundary>
          : <UpgradePrompt feature="Cover Letter Generator" description="Claude writes a tailored, professional cover letter based on your resume and job description." />
      )}
      {activeTab === 'linkedin' && (
        isPro
          ? <ErrorBoundary tabName="LinkedIn Optimizer">
              <LinkedInTab result={linkedin} isLoading={isStreamingLinkedIn && !linkedin} isStreaming={isStreamingLinkedIn} hasResume={!!resumeText} targetRole={targetRole} setTargetRole={setTargetRole} onRun={runLinkedIn} error={linkedinError} />
            </ErrorBoundary>
          : <UpgradePrompt feature="LinkedIn Optimizer" description="Claude crafts a keyword-rich headline and summary optimized for your target role." />
      )}
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--gray-50)' }}>

      {/* Header */}
      <header style={{
        background: 'white', borderBottom: '1px solid var(--gray-100)',
        padding: isMobile ? '0 16px' : '0 32px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56, flexShrink: 0,
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Logo size="sm" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
          {/* Hide email on mobile — too wide */}
          {user && !isMobile && <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{user.email}</span>}
          {!isPro && (
            <span style={{ background: 'var(--warning-light)', color: 'var(--warning)', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>FREE</span>
          )}
          {isPro && (
            <span style={{ background: 'var(--success-light)', color: 'var(--success)', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>PRO</span>
          )}
          {!isPro && <Button size="sm" variant="primary" onClick={() => navigate('/pricing')}>Upgrade</Button>}
          {user
            ? <Button size="sm" variant="ghost" onClick={() => { signOut(); navigate('/') }}>Sign Out</Button>
            : <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
          }
        </div>
      </header>

      {/* Body */}
      {isMobile ? (
        // ── Mobile: stacked layout ──────────────────────────────────────────────
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px', gap: 12 }}>
          {inputPanel}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tabBar}
            {tabContent}
          </div>
        </div>
      ) : (
        // ── Desktop: side-by-side layout ────────────────────────────────────────
        <div style={{ display: 'flex', flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '24px', gap: 0 }}>
          {inputPanel}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {tabBar}
            {tabContent}
          </div>
        </div>
      )}
    </div>
  )
}
