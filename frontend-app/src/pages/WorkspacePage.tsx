import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQuery } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { ScoreRing } from '../components/ScoreRing'
import { KeywordPill } from '../components/KeywordPill'
import {
  uploadResume, scanResume, optimizeResume,
  generateCoverLetter, optimizeLinkedIn, getProStatus,
  type ScanResult, type OptimizeResult,
} from '../api/resumeApi'
import { ResumePDF } from '../features/resume-templates/renderers/ResumePDF'
import { parseResumeText } from '../features/resume-templates/utils/parseResumeText'
import { templateConfigMap } from '../features/resume-templates/config'
import type { ResumeTemplate } from '../types/resumeTemplate'

type Tab = 'scan' | 'optimize' | 'cover-letter' | 'linkedin'

export function WorkspacePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('scan')
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [linkedin, setLinkedin] = useState<{ headline: string; summary: string } | null>(null)
  const [uploadError, setUploadError] = useState('')

  const proQuery = useQuery({
    queryKey: ['pro-status', user?.id],
    queryFn: () => getProStatus(user?.id),
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

  const scanMutation = useMutation({
    mutationFn: () => scanResume(resumeText, jobDescription || undefined),
    onSuccess: (data) => { setScanResult(data); setActiveTab('scan') },
  })

  const optimizeMutation = useMutation({
    mutationFn: () => optimizeResume(resumeText, jobDescription || undefined),
    onSuccess: (data) => { setOptimizeResult(data) },
  })

  const coverMutation = useMutation({
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
    onDrop, accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] },
    maxFiles: 1,
  })

  const tabs: { id: Tab; label: string; icon: string; pro?: boolean }[] = [
    { id: 'scan', label: 'ATS Scan', icon: '🎯' },
    { id: 'optimize', label: 'Optimize', icon: '✨', pro: true },
    { id: 'cover-letter', label: 'Cover Letter', icon: '📝', pro: true },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼', pro: true },
  ]

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
          {user && (
            <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{user.email}</span>
          )}
          {!isPro && (
            <span style={{
              background: 'var(--warning-light)', color: 'var(--warning)',
              fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            }}>FREE PLAN</span>
          )}
          {isPro && (
            <span style={{
              background: 'var(--success-light)', color: 'var(--success)',
              fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            }}>PRO</span>
          )}
          {!isPro && <Button size="sm" variant="primary" onClick={() => navigate('/pricing')}>Upgrade to Pro</Button>}
          {user
            ? <Button size="sm" variant="ghost" onClick={() => { signOut(); navigate('/') }}>Sign Out</Button>
            : <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
          }
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, gap: 0, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '24px 24px' }}>
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
                borderRadius: 'var(--radius)',
                padding: '20px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? 'var(--success-light)' : 'var(--gray-50)',
                transition: 'all var(--transition)',
                marginBottom: 12,
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

          {scanMutation.isError && (
            <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>
              Scan failed. Make sure the backend is running.
            </p>
          )}
        </div>

        {/* Right Panel — Results */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 'var(--radius-lg)', padding: 6, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 'var(--radius)',
                  fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: activeTab === tab.id ? 'var(--navy)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--gray-500)',
                  transition: 'all var(--transition)',
                  position: 'relative',
                }}
              >
                <span>{tab.icon} {tab.label}</span>
                {tab.pro && (
                  <span style={{
                    position: 'absolute', top: 2, right: 6,
                    background: 'var(--emerald)', color: 'white',
                    fontSize: 9, fontWeight: 800, padding: '1px 5px',
                    borderRadius: 999, letterSpacing: '0.04em',
                  }}>PRO</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'scan' && <ScanTab result={scanResult} isLoading={scanMutation.isPending} hasResume={!!resumeText} />}
          {activeTab === 'optimize' && (
            isPro
              ? <OptimizeTab result={optimizeResult} isLoading={optimizeMutation.isPending} hasResume={!!resumeText} onRun={() => optimizeMutation.mutate()} error={optimizeMutation.isError} />
              : <UpgradePrompt feature="Resume Optimizer" description="Claude rewrites your resume to maximize ATS alignment with your target job description." />
          )}
          {activeTab === 'cover-letter' && (
            isPro
              ? <CoverLetterTab result={coverLetter} isLoading={coverMutation.isPending} hasResume={!!resumeText} companyName={companyName} setCompanyName={setCompanyName} onRun={() => coverMutation.mutate()} error={coverMutation.isError} />
              : <UpgradePrompt feature="Cover Letter Generator" description="Claude writes a tailored, professional cover letter based on your resume and job description." />
          )}
          {activeTab === 'linkedin' && (
            isPro
              ? <LinkedInTab result={linkedin} isLoading={linkedinMutation.isPending} hasResume={!!resumeText} targetRole={targetRole} setTargetRole={setTargetRole} onRun={() => linkedinMutation.mutate()} error={linkedinMutation.isError} />
              : <UpgradePrompt feature="LinkedIn Optimizer" description="Claude crafts a keyword-rich headline and summary optimized for your target role." />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Scan Tab ───────────────────────────────────────────────

function ScanTab({ result, isLoading, hasResume }: { result: ScanResult | null; isLoading: boolean; hasResume: boolean }) {
  if (isLoading) return <LoadingCard message="Claude is evaluating your resume against the job description..." />
  if (!result) return <EmptyState icon="🎯" title="Your ATS report will appear here" subtitle={hasResume ? 'Click "Run ATS Scan" to get your score.' : 'Upload or paste your resume to get started.'} />

  const scoreColor = result.overallScore >= 75 ? 'var(--success)' : result.overallScore >= 55 ? '#D97706' : 'var(--danger)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>

      {/* Score Card */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <ScoreRing score={result.overallScore} size={110} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>ATS Compatibility Report</h2>
              {result.semantic && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'white', background: 'var(--emerald)', borderRadius: 999, padding: '2px 8px' }}>AI Scored</span>
              )}
            </div>
            <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6 }}>
              {result.overallScore >= 75
                ? 'Strong compatibility. Your resume is likely to pass automated screening.'
                : result.overallScore >= 55
                  ? 'Moderate compatibility. Some key areas need strengthening.'
                  : 'Low compatibility. Your resume may be filtered out before a human sees it.'}
            </p>
          </div>
        </div>

        {/* Recruiter Verdict */}
        {result.recruiterVerdict && (
          <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', borderLeft: `4px solid ${scoreColor}` }}>
            <p style={{ fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.7, fontStyle: 'italic' }}>
              "{result.recruiterVerdict}"
            </p>
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      {result.categoryScores?.length > 0 && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
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
                    <div style={{
                      height: '100%', borderRadius: 999, width: `${pct}%`,
                      background: barColor, transition: 'width 0.8s ease',
                    }} />
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

      {/* Strengths & Gaps */}
      {(result.strengths?.length > 0 || result.gaps?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

      {/* Skills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

// ─── Optimize Tab ────────────────────────────────────────────

const TEMPLATE_OPTIONS: { id: ResumeTemplate; label: string; description: string }[] = [
  { id: 'professional', label: 'Professional', description: 'Classic, compact layout' },
  { id: 'modern',       label: 'Modern',       description: 'Clean & contemporary' },
  { id: 'executive',    label: 'Executive',    description: 'Premium, centered header' },
]

function OptimizeTab({ result, isLoading, hasResume, onRun, error }: {
  result: OptimizeResult | null; isLoading: boolean; hasResume: boolean; onRun: () => void; error: boolean
}) {
  const [view, setView] = useState<'optimized' | 'original'>('optimized')
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>('professional')
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadPDF = async () => {
    if (!result?.optimizedResumeText) return
    setIsDownloading(true)
    try {
      const resumeData = parseResumeText(result.optimizedResumeText)
      const templateConfig = templateConfigMap[selectedTemplate]
      const blob = await pdf(<ResumePDF resume={resumeData} template={templateConfig} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume-${selectedTemplate}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) return <LoadingCard message="Claude is optimizing your resume..." />
  if (!result) return (
    <EmptyCard>
      <EmptyState icon="✨" title="AI Resume Optimization" subtitle="Claude will rewrite your resume to maximize ATS keyword alignment without fabricating your experience." />
      <Button fullWidth size="lg" variant="secondary" disabled={!hasResume} onClick={onRun} style={{ marginTop: 16 }}>
        ✨ Optimize My Resume
      </Button>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>Optimization failed. Make sure your Anthropic API key is set.</p>}
    </EmptyCard>
  )

  const improved = result.scoreImprovement > 0
  const hasOptimizedText = result.optimizedResumeText && result.optimizedResumeText !== result.originalResumeText

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>
      {/* Score Delta */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 20 }}>Optimization Results</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Before</div>
            <ScoreRing score={result.originalScore} size={90} label="" />
          </div>
          <div style={{ fontSize: 32, color: 'var(--gray-200)' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>After</div>
            <ScoreRing score={result.optimizedScore} size={90} label="" />
          </div>
          <div style={{ flex: 1, paddingLeft: 20 }}>
            {improved ? (
              <>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)' }}>+{result.scoreImprovement} points</div>
                <div style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 4 }}>ATS score improvement</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-500)' }}>No improvement possible</div>
                <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Your resume is already well-optimized.</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Optimized Resume Text */}
      {hasOptimizedText && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Your Optimized Resume</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['optimized', 'original'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600,
                  border: '1px solid var(--gray-200)', cursor: 'pointer',
                  background: view === v ? 'var(--navy)' : 'transparent',
                  color: view === v ? 'white' : 'var(--gray-500)',
                }}>
                  {v === 'optimized' ? 'Optimized' : 'Original'}
                </button>
              ))}
            </div>
          </div>
          <pre style={{
            whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: 13,
            color: 'var(--charcoal)', lineHeight: 1.7, maxHeight: 400,
            overflow: 'auto', padding: 16, background: 'var(--gray-50)', borderRadius: 'var(--radius)',
          }}>
            {view === 'optimized' ? result.optimizedResumeText : result.originalResumeText}
          </pre>
          <Button
            style={{ marginTop: 12 }} size="sm" variant="outline"
            onClick={() => { navigator.clipboard.writeText(result.optimizedResumeText) }}
          >
            📋 Copy to Clipboard
          </Button>
        </div>
      )}

      {/* PDF Template Picker + Download (shown when optimized text exists) */}
      {hasOptimizedText && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Download as PDF</h3>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>Choose a template and download your optimized resume as a polished PDF.</p>

          {/* Template selector */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {TEMPLATE_OPTIONS.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                style={{
                  flex: 1,
                  padding: '12px 10px',
                  borderRadius: 'var(--radius)',
                  border: `2px solid ${selectedTemplate === t.id ? 'var(--navy)' : 'var(--gray-200)'}`,
                  background: selectedTemplate === t.id ? 'var(--navy)' : 'white',
                  color: selectedTemplate === t.id ? 'white' : 'var(--charcoal)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t.label}</div>
                <div style={{
                  fontSize: 11,
                  marginTop: 3,
                  color: selectedTemplate === t.id ? 'rgba(255,255,255,0.75)' : 'var(--gray-400)',
                }}>
                  {t.description}
                </div>
              </button>
            ))}
          </div>

          <Button
            size="md"
            variant="secondary"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            style={{ minWidth: 180 }}
          >
            {isDownloading ? '⏳ Generating PDF...' : '⬇️ Download PDF'}
          </Button>
        </div>
      )}

      {result.optimizationGuidance && (
        <div style={{ background: 'var(--warning-light)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid #FDE68A' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', marginBottom: 10 }}>{result.optimizationGuidance.title}</h3>
          {result.optimizationGuidance.reasons.map((r, i) => <p key={i} style={{ fontSize: 13, color: 'var(--charcoal)', marginBottom: 4 }}>• {r}</p>)}
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)', marginTop: 12 }}>{result.optimizationGuidance.suggestionsTitle}</p>
          {result.optimizationGuidance.suggestions.map((s, i) => <p key={i} style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>→ {s}</p>)}
        </div>
      )}
    </div>
  )
}

// ─── Cover Letter Tab ────────────────────────────────────────

function CoverLetterTab({ result, isLoading, hasResume, companyName, setCompanyName, onRun, error }: {
  result: string; isLoading: boolean; hasResume: boolean
  companyName: string; setCompanyName: (v: string) => void; onRun: () => void; error: boolean
}) {
  if (isLoading) return <LoadingCard message="Claude is writing your cover letter..." />
  if (!result) return (
    <EmptyCard>
      <EmptyState icon="📝" title="Cover Letter Generator" subtitle="Claude writes a tailored, professional cover letter based on your resume and the job description." />
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: 6 }}>Company Name (optional)</label>
        <input
          value={companyName} onChange={e => setCompanyName(e.target.value)}
          placeholder="e.g. Google, Stripe, Acme Corp"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 12 }}
        />
        <Button fullWidth size="lg" variant="secondary" disabled={!hasResume} onClick={onRun}>
          📝 Generate Cover Letter
        </Button>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>Generation failed. Make sure your Anthropic API key is set.</p>}
      </div>
    </EmptyCard>
  )

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>Your Cover Letter</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(result)}>📋 Copy</Button>
          <Button size="sm" variant="secondary" onClick={onRun}>Regenerate</Button>
        </div>
      </div>
      <div style={{
        background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '24px 28px',
        fontSize: 14, lineHeight: 1.8, color: 'var(--charcoal)', whiteSpace: 'pre-wrap',
        maxHeight: 560, overflow: 'auto',
      }}>
        {result}
      </div>
    </div>
  )
}

// ─── LinkedIn Tab ─────────────────────────────────────────────

function LinkedInTab({ result, isLoading, hasResume, targetRole, setTargetRole, onRun, error }: {
  result: { headline: string; summary: string } | null; isLoading: boolean; hasResume: boolean
  targetRole: string; setTargetRole: (v: string) => void; onRun: () => void; error: boolean
}) {
  if (isLoading) return <LoadingCard message="Claude is optimizing your LinkedIn profile..." />
  if (!result) return (
    <EmptyCard>
      <EmptyState icon="💼" title="LinkedIn Optimizer" subtitle="Get an optimized LinkedIn headline and About section that attracts recruiters and passes LinkedIn search algorithms." />
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: 6 }}>Target Role (optional)</label>
        <input
          value={targetRole} onChange={e => setTargetRole(e.target.value)}
          placeholder="e.g. Senior Product Manager, Software Engineer"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 12 }}
        />
        <Button fullWidth size="lg" variant="secondary" disabled={!hasResume} onClick={onRun}>
          💼 Optimize LinkedIn Profile
        </Button>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>Generation failed. Make sure your Anthropic API key is set.</p>}
      </div>
    </EmptyCard>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>LinkedIn Headline</h3>
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(result.headline)}>📋 Copy</Button>
        </div>
        <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '14px 16px', fontSize: 16, fontWeight: 600, color: 'var(--charcoal)' }}>
          {result.headline}
        </div>
        <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>{result.headline.length}/220 characters</p>
      </div>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>About Section</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(result.summary)}>📋 Copy</Button>
            <Button size="sm" variant="secondary" onClick={onRun}>Regenerate</Button>
          </div>
        </div>
        <div style={{
          background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '16px',
          fontSize: 14, lineHeight: 1.8, color: 'var(--charcoal)', whiteSpace: 'pre-wrap',
          maxHeight: 400, overflow: 'auto',
        }}>
          {result.summary}
        </div>
      </div>
    </div>
  )
}

// ─── Shared Utility Components ───────────────────────────────

function LoadingCard({ message }: { message: string }) {
  return (
    <div style={{
      background: 'white', borderRadius: 'var(--radius-lg)', padding: '60px 32px',
      textAlign: 'center', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)',
    }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--navy)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 20px' }} />
      <p style={{ color: 'var(--gray-500)', fontSize: 15 }}>{message}</p>
    </div>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--gray-400)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>{subtitle}</p>
    </div>
  )
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '32px 28px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
      {children}
    </div>
  )
}

function UpgradePrompt({ feature, description }: { feature: string; description: string }) {
  const navigate = useNavigate()
  return (
    <div style={{
      background: 'white', borderRadius: 'var(--radius-lg)', padding: '56px 32px',
      textAlign: 'center', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)',
    }}>
      <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 10 }}>{feature}</h3>
      <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 28px' }}>{description}</p>
      <button
        onClick={() => navigate('/pricing')}
        style={{
          background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 'var(--radius)',
          padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Upgrade to Pro
      </button>
    </div>
  )
}
