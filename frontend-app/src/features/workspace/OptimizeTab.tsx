import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Button } from '../../components/Button'
import { ScoreRing } from '../../components/ScoreRing'
import { LoadingCard, EmptyState, EmptyCard } from './shared'
import { ResumePDF } from '../resume-templates/renderers/ResumePDF'
import { parseResumeText } from '../resume-templates/utils/parseResumeText'
import { templateConfigMap } from '../resume-templates/config'
import type { OptimizeResult } from '../../api/resumeApi'
import type { ResumeTemplate } from '../../types/resumeTemplate'

const TEMPLATE_OPTIONS: { id: ResumeTemplate; label: string; description: string }[] = [
  { id: 'professional', label: 'Professional', description: 'Classic, compact layout' },
  { id: 'modern',       label: 'Modern',       description: 'Clean & contemporary' },
  { id: 'executive',    label: 'Executive',    description: 'Premium, centered header' },
]

interface Props {
  result: OptimizeResult | null
  isLoading: boolean
  hasResume: boolean
  onRun: () => void
  error: string
}

export function OptimizeTab({ result, isLoading, hasResume, onRun, error }: Props) {
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
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>{error}</p>}
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

      {/* PDF Template Picker + Download */}
      {hasOptimizedText && (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Download as PDF</h3>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>Choose a template and download your optimized resume as a polished PDF.</p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {TEMPLATE_OPTIONS.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                style={{
                  flex: 1, padding: '12px 10px', borderRadius: 'var(--radius)',
                  border: `2px solid ${selectedTemplate === t.id ? 'var(--navy)' : 'var(--gray-200)'}`,
                  background: selectedTemplate === t.id ? 'var(--navy)' : 'white',
                  color: selectedTemplate === t.id ? 'white' : 'var(--charcoal)',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t.label}</div>
                <div style={{ fontSize: 11, marginTop: 3, color: selectedTemplate === t.id ? 'rgba(255,255,255,0.75)' : 'var(--gray-400)' }}>
                  {t.description}
                </div>
              </button>
            ))}
          </div>
          <Button size="md" variant="secondary" onClick={handleDownloadPDF} disabled={isDownloading} style={{ minWidth: 180 }}>
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
