import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { ScanTab } from '../features/workspace/ScanTab'
import { OptimizeTab } from '../features/workspace/OptimizeTab'
import { CoverLetterTab } from '../features/workspace/CoverLetterTab'
import { LinkedInTab } from '../features/workspace/LinkedInTab'
import { UpgradePrompt } from '../features/workspace/shared'
import {
  uploadResume, scanResume, optimizeResume,
  generateCoverLetter, optimizeLinkedIn, getProStatus,
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

  if (!loading && !user) { navigate('/login'); return null }

  const [activeTab, setActiveTab]         = useState<Tab>('scan')
  const [resumeText, setResumeText]       = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [companyName, setCompanyName]     = useState('')
  const [targetRole, setTargetRole]       = useState('')
  const [scanResult, setScanResult]       = useState<ScanResult | null>(null)
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null)
  const [coverLetter, setCoverLetter]     = useState('')
  const [linkedin, setLinkedin]           = useState<{ headline: string; summary: string } | null>(null)
  const [uploadError, setUploadError]     = useState('')

  const proQuery = useQuery({
    queryKey: ['pro-status', user?.id],
    queryFn: () => getProStatus(),
    staleTime: 60_000,
  })
  const isPro = proQuery.data?.isPro ?? false

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: (data) => { setResumeText(data.resumeText); setUploadError('') },
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
    onSuccess: (data) => { setScanResult(data); setActiveTab('scan') },
  })
  const optimizeMutation = useMutation({
    mutationFn: () => optimizeResume(resumeText, jobDescription || undefined),
    onSuccess: (data) => setOptimizeResult(data),
  })
  const coverMutation    = useMutation({
    mutationFn: () => generateCoverLetter({ resumeText, jobDescription: jobDescription || undefined, companyName: companyName || undefined }),
    onSuccess: (data) => setCoverLetter(data.coverLetter),
  })
  const linkedinMutation = useMutation({
    mutationFn: () => optimizeLinkedIn({ resumeText, jobDescription: jobDescription || undefined, targetRole: targetRole || undefined }),
    onSuccess: (data) => setLinkedin(data),
  })

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

  const scanError = (scanMutation.error as Error)?.message || ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--gray-50)' }}>

      {/* Header */}
      <header style={{
        background: 'white', borderBottom: '1px solid var(--gray-100)',
        padding: '0 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 60, flexShrink: 0,
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Logo size="sm" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{user.email}</span>}
          {!isPro && (
            <span style={{ background: 'var(--warning-light)', color: 'var(--warning)', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>FREE PLAN</span>
          )}
          {isPro && (
            <span style={{ background: 'var(--success-light)', color: 'var(--success)', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>PRO</span>
          )}
          {!isPro && <Button size="sm" variant="primary" onClick={() => navigate('/pricing')}>Upgrade to Pro</Button>}
          {user
            ? <Button size="sm" variant="ghost" onClick={() => { signOut(); navigate('/') }}>Sign Out</Button>
            : <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
          }
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '24px 24px', gap: 0 }}>

        {/* Left Panel — Input */}
        <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, marginRight: 20 }}>

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
        </div>

        {/* Right Panel — Tabs + Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

          {/* Tab Bar */}
          <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 'var(--radius-lg)', padding: 6, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 'var(--radius)',
                  fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: activeTab === tab.id ? 'var(--navy)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--gray-500)',
                  transition: 'all var(--transition)', position: 'relative',
                }}
              >
                <span>{tab.icon} {tab.label}</span>
                {tab.pro && (
                  <span style={{
                    position: 'absolute', top: 2, right: 6,
                    background: 'var(--emerald)', color: 'white',
                    fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 999, letterSpacing: '0.04em',
                  }}>PRO</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'scan' && (
            <ErrorBoundary tabName="ATS Scanner">
              <ScanTab result={scanResult} isLoading={scanMutation.isPending} hasResume={!!resumeText} isPro={isPro} error={scanError} />
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
                  <CoverLetterTab result={coverLetter} isLoading={coverMutation.isPending} hasResume={!!resumeText} companyName={companyName} setCompanyName={setCompanyName} onRun={() => coverMutation.mutate()} error={(coverMutation.error as Error)?.message || ''} />
                </ErrorBoundary>
              : <UpgradePrompt feature="Cover Letter Generator" description="Claude writes a tailored, professional cover letter based on your resume and job description." />
          )}
          {activeTab === 'linkedin' && (
            isPro
              ? <ErrorBoundary tabName="LinkedIn Optimizer">
                  <LinkedInTab result={linkedin} isLoading={linkedinMutation.isPending} hasResume={!!resumeText} targetRole={targetRole} setTargetRole={setTargetRole} onRun={() => linkedinMutation.mutate()} error={(linkedinMutation.error as Error)?.message || ''} />
                </ErrorBoundary>
              : <UpgradePrompt feature="LinkedIn Optimizer" description="Claude crafts a keyword-rich headline and summary optimized for your target role." />
          )}
        </div>
      </div>
    </div>
  )
}
