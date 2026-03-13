import type { ResumeTemplate } from '../../../types/resumeTemplate'
import type {
  ResumeCertificationItem,
  ResumeEducationItem,
  ResumeExperienceItem,
  StructuredResume,
} from '../../../types/resumeSchema'
import { templateConfigMap } from '../config'

interface ResumeTemplateRendererProps {
  resume: StructuredResume
  template: ResumeTemplate
}

function getSpacingStyles(density: 'compact' | 'comfortable' | 'premium') {
  switch (density) {
    case 'premium':
      return {
        sectionGap: '28px',
        itemGap: '16px',
        blockPadding: '36px',
      }
    case 'comfortable':
      return {
        sectionGap: '24px',
        itemGap: '14px',
        blockPadding: '32px',
      }
    default:
      return {
        sectionGap: '20px',
        itemGap: '12px',
        blockPadding: '28px',
      }
  }
}

function formatHeading(
  heading: string,
  style: 'uppercase' | 'titlecase',
): string {
  return style === 'uppercase' ? heading.toUpperCase() : heading
}

function renderSkills(
  skills: string[],
  style: 'list' | 'inline-pills' | 'pipe-separated',
) {
  if (skills.length === 0) return null

  if (style === 'inline-pills') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {skills.map((skill) => (
          <span
            key={skill}
            style={{
              padding: '6px 10px',
              borderRadius: '999px',
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              fontSize: '0.9rem',
            }}
          >
            {skill}
          </span>
        ))}
      </div>
    )
  }

  if (style === 'pipe-separated') {
    return (
      <p style={{ margin: 0, color: '#1f2937', lineHeight: 1.7 }}>
        {skills.join(' | ')}
      </p>
    )
  }

  return (
    <ul style={{ margin: 0, paddingLeft: '18px', color: '#1f2937' }}>
      {skills.map((skill) => (
        <li key={skill} style={{ marginBottom: '6px' }}>
          {skill}
        </li>
      ))}
    </ul>
  )
}

function renderExperienceItem(
  item: ResumeExperienceItem,
  layout: 'standard' | 'title-first' | 'stacked',
) {
  if (layout === 'title-first') {
    return (
      <div>
        <div style={{ fontWeight: 700, color: '#111827' }}>{item.title}</div>
        <div style={{ color: '#4b5563', marginBottom: '8px' }}>{item.company}</div>
        <ul style={{ margin: 0, paddingLeft: '18px', color: '#1f2937' }}>
          {item.bullets.map((bullet, index) => (
            <li key={`${item.company}-${index}`} style={{ marginBottom: '6px' }}>
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (layout === 'stacked') {
    return (
      <div>
        <div style={{ fontWeight: 700, color: '#111827' }}>{item.company}</div>
        <div style={{ color: '#374151', marginBottom: '8px' }}>{item.title}</div>
        <ul style={{ margin: 0, paddingLeft: '18px', color: '#1f2937' }}>
          {item.bullets.map((bullet, index) => (
            <li key={`${item.company}-${index}`} style={{ marginBottom: '6px' }}>
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontWeight: 700, color: '#111827' }}>
        {item.company} — {item.title}
      </div>
      <ul style={{ margin: '8px 0 0', paddingLeft: '18px', color: '#1f2937' }}>
        {item.bullets.map((bullet, index) => (
          <li key={`${item.company}-${index}`} style={{ marginBottom: '6px' }}>
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  )
}

function renderEducationItem(item: ResumeEducationItem) {
  const parts = [item.degree, item.fieldOfStudy].filter(Boolean).join(' — ')

  return (
    <div>
      <div style={{ fontWeight: 700, color: '#111827' }}>{item.institution}</div>
      {parts ? <div style={{ color: '#4b5563' }}>{parts}</div> : null}
    </div>
  )
}

function renderCertificationItem(item: ResumeCertificationItem) {
  return (
    <div>
      <div style={{ fontWeight: 700, color: '#111827' }}>{item.name}</div>
      {item.issuer ? <div style={{ color: '#4b5563' }}>{item.issuer}</div> : null}
    </div>
  )
}

export function ResumeTemplateRenderer({
  resume,
  template,
}: ResumeTemplateRendererProps) {
  const config = templateConfigMap[template]
  const spacing = getSpacingStyles(config.spacingDensity)

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '18px',
        padding: spacing.blockPadding,
        boxShadow: '0 8px 24px rgba(17, 24, 39, 0.06)',
      }}
    >
      <header style={{ marginBottom: spacing.sectionGap }}>
        <h1
          style={{
            margin: 0,
            fontSize: template === 'executive' ? '2rem' : '1.75rem',
            fontWeight: 800,
            color: '#111827',
          }}
        >
          {resume.fullName}
        </h1>

        {resume.headline ? (
          <p
            style={{
              margin: '8px 0 0',
              color: '#4b5563',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            {resume.headline}
          </p>
        ) : null}

        <div
          style={{
            marginTop: '10px',
            color: '#6b7280',
            fontSize: '0.95rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {resume.contact.email ? <span>{resume.contact.email}</span> : null}
          {resume.contact.phone ? <span>{resume.contact.phone}</span> : null}
          {resume.contact.location ? <span>{resume.contact.location}</span> : null}
          {resume.contact.linkedin ? <span>{resume.contact.linkedin}</span> : null}
          {resume.contact.portfolio ? <span>{resume.contact.portfolio}</span> : null}
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gap: spacing.sectionGap,
        }}
      >
        {config.sectionOrder.map((sectionKey) => {
          if (sectionKey === 'summary' && resume.summary) {
            return (
              <section key="summary">
                <h2
                  style={{
                    margin: '0 0 10px',
                    fontSize: '0.95rem',
                    letterSpacing: '0.08em',
                    color: '#111827',
                    fontWeight: 800,
                  }}
                >
                  {formatHeading('Summary', config.headingStyle)}
                </h2>
                <p style={{ margin: 0, color: '#1f2937', lineHeight: 1.7 }}>
                  {resume.summary}
                </p>
              </section>
            )
          }

          if (sectionKey === 'skills' && resume.skills.length > 0) {
            return (
              <section key="skills">
                <h2
                  style={{
                    margin: '0 0 10px',
                    fontSize: '0.95rem',
                    letterSpacing: '0.08em',
                    color: '#111827',
                    fontWeight: 800,
                  }}
                >
                  {formatHeading('Skills', config.headingStyle)}
                </h2>
                {renderSkills(resume.skills, config.skillsStyle)}
              </section>
            )
          }

          if (sectionKey === 'experience' && resume.experience.length > 0) {
            return (
              <section key="experience">
                <h2
                  style={{
                    margin: '0 0 10px',
                    fontSize: '0.95rem',
                    letterSpacing: '0.08em',
                    color: '#111827',
                    fontWeight: 800,
                  }}
                >
                  {formatHeading('Experience', config.headingStyle)}
                </h2>
                <div style={{ display: 'grid', gap: spacing.itemGap }}>
                  {resume.experience.map((item, index) => (
                    <div key={`${item.company}-${index}`}>
                      {renderExperienceItem(item, config.experienceLayout)}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (sectionKey === 'education' && resume.education.length > 0) {
            return (
              <section key="education">
                <h2
                  style={{
                    margin: '0 0 10px',
                    fontSize: '0.95rem',
                    letterSpacing: '0.08em',
                    color: '#111827',
                    fontWeight: 800,
                  }}
                >
                  {formatHeading('Education', config.headingStyle)}
                </h2>
                <div style={{ display: 'grid', gap: spacing.itemGap }}>
                  {resume.education.map((item, index) => (
                    <div key={`${item.institution}-${index}`}>
                      {renderEducationItem(item)}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (sectionKey === 'certifications' && resume.certifications.length > 0) {
            return (
              <section key="certifications">
                <h2
                  style={{
                    margin: '0 0 10px',
                    fontSize: '0.95rem',
                    letterSpacing: '0.08em',
                    color: '#111827',
                    fontWeight: 800,
                  }}
                >
                  {formatHeading('Certifications', config.headingStyle)}
                </h2>
                <div style={{ display: 'grid', gap: spacing.itemGap }}>
                  {resume.certifications.map((item, index) => (
                    <div key={`${item.name}-${index}`}>
                      {renderCertificationItem(item)}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}