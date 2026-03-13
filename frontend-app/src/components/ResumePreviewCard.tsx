import type { ResumeTemplate } from '../types/resumeTemplate'
import { ResumeTemplateRenderer } from '../features/resume-templates/renderers/ResumeTemplateRenderer'
import { parseResumeText } from '../features/resume-templates/utils/parseResumeText'
import type { StructuredResume } from '../types/resumeSchema'
import type { ParsedResume } from '../features/resume-scan/types/resumeScan.types'

interface ResumePreviewCardProps {
  title: string
  subtitle?: string
  content: string
  accent?: 'default' | 'success'
  highlightKeywords?: string[]
  highlightLabel?: string
  highlightStyle?: 'matched' | 'resolved'
  template?: ResumeTemplate
  structuredResume?: ParsedResume
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getHighlightStyles(style: 'matched' | 'resolved') {
  if (style === 'resolved') {
    return {
      background: '#dcfce7',
      color: '#166534',
    }
  }

  return {
    background: '#fef3c7',
    color: '#92400e',
  }
}

function renderHighlightedText(
  text: string,
  keywords: string[],
  highlightStyle: 'matched' | 'resolved',
) {
  if (!keywords.length) {
    return text
  }

  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length)
  const pattern = sortedKeywords.map(escapeRegExp).join('|')

  if (!pattern) {
    return text
  }

  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(regex)
  const styles = getHighlightStyles(highlightStyle)

  return parts.map((part, index) => {
    const isMatch = sortedKeywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase())

    if (!isMatch) {
      return <span key={`${part}-${index}`}>{part}</span>
    }

    return (
      <mark
        key={`${part}-${index}`}
        style={{
          background: styles.background,
          color: styles.color,
          padding: '0.08em 0.22em',
          borderRadius: '6px',
          fontWeight: 700,
        }}
      >
        {part}
      </mark>
    )
  })
}

function mapParsedResumeToStructuredResume(parsed?: ParsedResume): StructuredResume | null {
  if (!parsed) {
    return null
  }

  return {
    fullName: parsed.full_name || '',
    headline: '',
    contact: {
      email: parsed.email || '',
      phone: parsed.phone || '',
      location: parsed.location || '',
    },
    summary: parsed.professional_summary || '',
    skills: parsed.skills || [],
    experience: (parsed.professional_experience || []).map((item) => ({
      company: item.company || '',
      title: item.title || '',
      bullets: item.description || [],
    })),
    education: (parsed.education || []).map((item) => ({
      institution: item,
    })),
    certifications: (parsed.certifications || []).map((item) => ({
      name: item,
    })),
  }
}

export function ResumePreviewCard({
  title,
  subtitle,
  content,
  accent = 'default',
  highlightKeywords = [],
  highlightLabel,
  highlightStyle = 'matched',
  template = 'professional',
  structuredResume,
}: ResumePreviewCardProps) {
  const styles =
    accent === 'success'
      ? {
          border: '1px solid #bfdbfe',
          background: '#f8fbff',
          titleColor: '#1e3a8a',
          badgeBg: '#dbeafe',
          badgeColor: '#1d4ed8',
        }
      : {
          border: '1px solid #e5e7eb',
          background: '#ffffff',
          titleColor: '#111827',
          badgeBg: '#f3f4f6',
          badgeColor: '#374151',
        }

  const mappedStructuredResume = mapParsedResumeToStructuredResume(structuredResume)
  const parsedResume = mappedStructuredResume ?? parseResumeText(content)

  return (
    <div
      style={{
        borderRadius: '18px',
        border: styles.border,
        background: styles.background,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(17, 24, 39, 0.06)',
      }}
    >
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: styles.titleColor, fontSize: '1.05rem' }}>{title}</h3>
          {subtitle ? (
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.92rem' }}>{subtitle}</p>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {highlightKeywords.length > 0 && highlightLabel ? (
            <span
              style={{
                padding: '7px 10px',
                borderRadius: '999px',
                background: highlightStyle === 'resolved' ? '#dcfce7' : '#fffbeb',
                color: highlightStyle === 'resolved' ? '#166534' : '#92400e',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {highlightLabel}
            </span>
          ) : null}

          <span
            style={{
              padding: '7px 10px',
              borderRadius: '999px',
              background: styles.badgeBg,
              color: styles.badgeColor,
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            {renderHighlightedText(
              template.charAt(0).toUpperCase() + template.slice(1),
              highlightKeywords,
              highlightStyle,
            )}
          </span>
        </div>
      </div>

      <div style={{ padding: '18px', background: '#f8fafc' }}>
        <ResumeTemplateRenderer resume={parsedResume} template={template} />
      </div>
    </div>
  )
}