// =========================================================
// File: ResumePDF.tsx
// Purpose:
// react-pdf Document component for all 3 resume templates.
// Takes a StructuredResume + ResumeTemplateConfig and renders
// a pixel-perfect, downloadable PDF.
// =========================================================

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { StructuredResume } from '../../../types/resumeSchema'
import type { ResumeTemplateConfig } from '../config/templateTypes'

interface Props {
  resume: StructuredResume
  template: ResumeTemplateConfig
}

// ── Accent color per template ─────────────────────────────
const ACCENT: Record<string, string> = {
  professional: '#1a1a1a',
  modern:       '#1e3a5f',
  executive:    '#2c3e50',
}

// ── Section gap per spacing density ──────────────────────
const SECTION_GAP: Record<string, number> = {
  compact:     8,
  comfortable: 13,
  premium:     20,
}

// ── Base styles (shared across all templates) ─────────────
const base = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 50,
    paddingRight: 50,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#333333',
    lineHeight: 1.45,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  headline: {
    fontSize: 10,
    color: '#555555',
    marginBottom: 3,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  contactSep: {
    fontSize: 8.5,
    color: '#888888',
    marginRight: 6,
  },
  contactItem: {
    fontSize: 8.5,
    color: '#555555',
    marginRight: 6,
  },
  sectionHeading: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.6,
    paddingBottom: 3,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#cccccc',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
  },
  entrySubtitle: {
    fontSize: 9,
    color: '#555555',
    marginTop: 1,
  },
  entryDate: {
    fontSize: 9,
    color: '#777777',
  },
  bullet: {
    flexDirection: 'row',
    marginTop: 2,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 10,
    fontSize: 9.5,
    color: '#555555',
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.4,
  },
})

// ── Heading text formatter ────────────────────────────────
function formatHeading(text: string, style: 'uppercase' | 'titlecase'): string {
  return style === 'uppercase' ? text.toUpperCase() : text
}

// ── Contact items (joins non-empty fields with separator) ─
function ContactRow({ resume, isCenter }: { resume: StructuredResume; isCenter: boolean }) {
  const items = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
  ].filter(Boolean) as string[]

  return (
    <View style={{ ...base.contactRow, justifyContent: isCenter ? 'center' : 'flex-start' }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          {i > 0 && <Text style={base.contactSep}>·</Text>}
          <Text style={base.contactItem}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

// ── Section heading ───────────────────────────────────────
function SectionHeading({ label, accent, headingStyle }: {
  label: string
  accent: string
  headingStyle: 'uppercase' | 'titlecase'
}) {
  return (
    <Text style={{ ...base.sectionHeading, color: accent, borderBottomColor: accent }}>
      {formatHeading(label, headingStyle)}
    </Text>
  )
}

// ── Main PDF component ────────────────────────────────────
export function ResumePDF({ resume, template }: Props) {
  const accent   = ACCENT[template.id]   ?? '#1a1a1a'
  const gap      = SECTION_GAP[template.spacingDensity] ?? 13
  const isExec   = template.id === 'executive'
  const { headingStyle, skillsStyle, experienceLayout, sectionOrder } = template

  // ── Header ──────────────────────────────────────────────
  const renderHeader = () => (
    <View style={{ marginBottom: gap }}>
      <Text style={{
        ...base.name,
        color: accent,
        textAlign: isExec ? 'center' : 'left',
      }}>
        {resume.fullName}
      </Text>

      {resume.headline ? (
        <Text style={{ ...base.headline, textAlign: isExec ? 'center' : 'left' }}>
          {resume.headline}
        </Text>
      ) : null}

      <ContactRow resume={resume} isCenter={isExec} />
    </View>
  )

  // ── Summary ─────────────────────────────────────────────
  const renderSummary = () => {
    if (!resume.summary) return null
    return (
      <View style={{ marginBottom: gap }}>
        <SectionHeading label="Summary" accent={accent} headingStyle={headingStyle} />
        <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>{resume.summary}</Text>
      </View>
    )
  }

  // ── Skills ──────────────────────────────────────────────
  const renderSkills = () => {
    if (!resume.skills?.length) return null

    const skills = resume.skills

    return (
      <View style={{ marginBottom: gap }}>
        <SectionHeading label="Skills" accent={accent} headingStyle={headingStyle} />
        {skillsStyle === 'pipe-separated' ? (
          <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>
            {skills.join('  |  ')}
          </Text>
        ) : skillsStyle === 'inline-pills' ? (
          <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>
            {skills.join(',  ')}
          </Text>
        ) : (
          // list style
          <View>
            {skills.map((skill, i) => (
              <Text key={i} style={{ fontSize: 9.5, marginBottom: 1 }}>• {skill}</Text>
            ))}
          </View>
        )}
      </View>
    )
  }

  // ── Experience ──────────────────────────────────────────
  const renderExperience = () => {
    if (!resume.experience?.length) return null

    return (
      <View style={{ marginBottom: gap }}>
        <SectionHeading label="Experience" accent={accent} headingStyle={headingStyle} />
        {resume.experience.map((exp, i) => {
          const dateStr = [exp.startDate, exp.endDate].filter(Boolean).join(' – ')

          return (
            <View key={i} style={{ marginBottom: i < resume.experience.length - 1 ? 9 : 0 }}>
              {experienceLayout === 'title-first' ? (
                <>
                  <View style={base.entryRow}>
                    <Text style={base.entryTitle}>{exp.title}</Text>
                    {dateStr ? <Text style={base.entryDate}>{dateStr}</Text> : null}
                  </View>
                  <Text style={base.entrySubtitle}>{exp.company}</Text>
                </>
              ) : experienceLayout === 'stacked' ? (
                <>
                  <Text style={base.entryTitle}>{exp.company}</Text>
                  <View style={base.entryRow}>
                    <Text style={base.entrySubtitle}>{exp.title}</Text>
                    {dateStr ? <Text style={base.entryDate}>{dateStr}</Text> : null}
                  </View>
                </>
              ) : (
                // standard
                <>
                  <View style={base.entryRow}>
                    <Text style={base.entryTitle}>{exp.company}</Text>
                    {dateStr ? <Text style={base.entryDate}>{dateStr}</Text> : null}
                  </View>
                  <Text style={base.entrySubtitle}>{exp.title}</Text>
                </>
              )}

              {exp.bullets.map((bullet, j) => (
                <View key={j} style={base.bullet}>
                  <Text style={base.bulletDot}>•</Text>
                  <Text style={base.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          )
        })}
      </View>
    )
  }

  // ── Education ───────────────────────────────────────────
  const renderEducation = () => {
    if (!resume.education?.length) return null

    return (
      <View style={{ marginBottom: gap }}>
        <SectionHeading label="Education" accent={accent} headingStyle={headingStyle} />
        {resume.education.map((edu, i) => (
          <View key={i} style={{ marginBottom: i < resume.education.length - 1 ? 5 : 0 }}>
            <Text style={base.entryTitle}>{edu.institution}</Text>
            {edu.degree ? (
              <Text style={base.entrySubtitle}>
                {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
              </Text>
            ) : null}
            {edu.graduationDate ? (
              <Text style={base.entrySubtitle}>{edu.graduationDate}</Text>
            ) : null}
          </View>
        ))}
      </View>
    )
  }

  // ── Certifications ──────────────────────────────────────
  const renderCertifications = () => {
    if (!resume.certifications?.length) return null

    return (
      <View style={{ marginBottom: gap }}>
        <SectionHeading label="Certifications" accent={accent} headingStyle={headingStyle} />
        {resume.certifications.map((cert, i) => (
          <View key={i} style={{ marginBottom: i < resume.certifications.length - 1 ? 4 : 0 }}>
            <Text style={base.entryTitle}>{cert.name}</Text>
            {cert.issuer ? (
              <Text style={base.entrySubtitle}>
                {cert.issuer}{cert.date ? ` · ${cert.date}` : ''}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    )
  }

  const renderers: Record<string, () => React.ReactElement | null> = {
    summary:          renderSummary,
    skills:           renderSkills,
    experience:       renderExperience,
    education:        renderEducation,
    certifications:   renderCertifications,
  }

  return (
    <Document>
      <Page size="LETTER" style={base.page}>
        {renderHeader()}
        {sectionOrder.map(section => {
          const render = renderers[section]
          if (!render) return null
          const node = render()
          return node ? <View key={section}>{node}</View> : null
        })}
      </Page>
    </Document>
  )
}
