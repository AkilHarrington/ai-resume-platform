// =========================================================
// ResumePDF.tsx — three genuinely distinct resume templates
//   Professional — ATS-safe single column, Helvetica
//   Modern       — Navy sidebar two-column layout
//   Executive    — Times-Roman serif, centered prestige header
// =========================================================

import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { StructuredResume } from '../../../types/resumeSchema'
import type { ResumeTemplateConfig } from '../config/templateTypes'

interface Props {
  resume: StructuredResume
  template: ResumeTemplateConfig
}

export function ResumePDF({ resume, template }: Props) {
  if (template.id === 'modern')    return <ModernPDF    resume={resume} />
  if (template.id === 'executive') return <ExecutivePDF resume={resume} />
  return <ProfessionalPDF resume={resume} />
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL — Clean, ATS-safe, single-column, Helvetica
// ─────────────────────────────────────────────────────────────────────────────

function ProfessionalPDF({ resume }: { resume: StructuredResume }) {
  const contactItems = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
  ].filter(Boolean) as string[]

  return (
    <Document>
      <Page
        size="LETTER"
        style={{
          paddingTop: 38,
          paddingBottom: 38,
          paddingLeft: 50,
          paddingRight: 50,
          fontFamily: 'Helvetica',
          fontSize: 9.5,
          color: '#333333',
          lineHeight: 1.45,
        }}
      >
        {/* ── Header ── */}
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 21, fontFamily: 'Helvetica-Bold', color: '#111111', marginBottom: 3 }}>
            {resume.fullName}
          </Text>
          {resume.headline && !resume.headline.includes('@') ? (
            <Text style={{ fontSize: 10, color: '#555555', marginBottom: 4 }}>{resume.headline}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
            {contactItems.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                {i > 0 && <Text style={{ fontSize: 8, color: '#BBBBBB', marginHorizontal: 5 }}>|</Text>}
                <Text style={{ fontSize: 8.5, color: '#555555' }}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={{ borderBottomWidth: 1.5, borderBottomColor: '#111111' }} />
        </View>

        {/* ── Summary ── */}
        {resume.summary ? (
          <View style={{ marginBottom: 8 }}>
            <ProfHeading label="PROFESSIONAL SUMMARY" />
            <Text style={{ fontSize: 9.5, lineHeight: 1.55, color: '#333333' }}>{resume.summary}</Text>
          </View>
        ) : null}

        {/* ── Core Competencies ── */}
        {resume.skills?.length ? (
          <View style={{ marginBottom: 8 }}>
            <ProfHeading label="CORE COMPETENCIES" />
            <Text style={{ fontSize: 9.5, lineHeight: 1.55, color: '#333333' }}>
              {resume.skills.join('  ·  ')}
            </Text>
          </View>
        ) : null}

        {/* ── Professional Experience ── */}
        {resume.experience?.length ? (
          <View style={{ marginBottom: 8 }}>
            <ProfHeading label="PROFESSIONAL EXPERIENCE" />
            {resume.experience.map((exp, i) => {
              const dateStr = [exp.startDate, exp.endDate].filter(Boolean).join(' – ')
              return (
                <View key={i} style={{ marginBottom: i < resume.experience.length - 1 ? 8 : 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#111111', flex: 1 }}>
                      {exp.company}
                    </Text>
                    {dateStr ? (
                      <Text style={{ fontSize: 8.5, color: '#777777', marginLeft: 8 }}>{dateStr}</Text>
                    ) : null}
                  </View>
                  {exp.title ? (
                    <Text style={{ fontSize: 9, color: '#666666', fontFamily: 'Helvetica-Oblique', marginTop: 1, marginBottom: 3 }}>
                      {exp.title}
                    </Text>
                  ) : null}
                  {exp.bullets.map((b, j) => (
                    <View key={j} style={{ flexDirection: 'row', marginTop: 2, paddingLeft: 2 }}>
                      <Text style={{ fontSize: 9, width: 10, color: '#666666' }}>•</Text>
                      <Text style={{ flex: 1, fontSize: 9.5, lineHeight: 1.45, color: '#333333' }}>{b}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>
        ) : null}

        {/* ── Education ── */}
        {resume.education?.length ? (
          <View style={{ marginBottom: 8 }}>
            <ProfHeading label="EDUCATION" />
            {resume.education.map((edu, i) => (
              <View key={i} style={{ marginBottom: i < resume.education.length - 1 ? 5 : 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#111111', flex: 1 }}>
                    {edu.institution}
                  </Text>
                  {edu.graduationDate ? (
                    <Text style={{ fontSize: 8.5, color: '#777777' }}>{edu.graduationDate}</Text>
                  ) : null}
                </View>
                {edu.degree ? (
                  <Text style={{ fontSize: 9, color: '#666666' }}>
                    {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Certifications ── */}
        {resume.certifications?.length ? (
          <View>
            <ProfHeading label="CERTIFICATIONS" />
            {resume.certifications.map((cert, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: i < resume.certifications.length - 1 ? 3 : 0 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#111111', flex: 1 }}>
                  {cert.name}
                </Text>
                {cert.date ? (
                  <Text style={{ fontSize: 8.5, color: '#777777' }}>{cert.date}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  )
}

function ProfHeading({ label }: { label: string }) {
  return (
    <View style={{ marginBottom: 5 }}>
      <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', letterSpacing: 1.4, color: '#111111' }}>
        {label}
      </Text>
      <View style={{ borderBottomWidth: 0.5, borderBottomColor: '#CCCCCC', marginTop: 2 }} />
    </View>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// MODERN — Two-column sidebar layout
// Left: navy sidebar — Contact, Skills pills, Education
// Right: white — Summary, Experience
// ─────────────────────────────────────────────────────────────────────────────

const NAVY       = '#0F4C81'
const LIGHT_BLUE = '#7BB3D4'
const SIDEBAR_W  = 190

function ModernPDF({ resume }: { resume: StructuredResume }) {
  const contactItems = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
  ].filter(Boolean) as string[]

  return (
    <Document>
      <Page size="LETTER" style={{ fontFamily: 'Helvetica', fontSize: 9.5, color: '#333333', padding: 0 }}>

        {/* Full-height sidebar background */}
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDEBAR_W, backgroundColor: NAVY }} />

        <View style={{ flexDirection: 'row' }}>

          {/* ── LEFT SIDEBAR ── */}
          <View style={{ width: SIDEBAR_W, paddingHorizontal: 22, paddingTop: 32, paddingBottom: 28 }}>

            <Text style={{ fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', lineHeight: 1.25, marginBottom: 2 }}>
              {resume.fullName}
            </Text>

            {resume.headline && !resume.headline.includes('@') ? (
              <Text style={{ fontSize: 8.5, color: LIGHT_BLUE, lineHeight: 1.4, marginBottom: 18 }}>
                {resume.headline}
              </Text>
            ) : (
              <View style={{ marginBottom: 18 }} />
            )}

            {/* Contact */}
            {contactItems.length > 0 && (
              <View style={{ marginBottom: 18 }}>
                <ModernSidebarHeading label="Contact" />
                {contactItems.map((item, i) => (
                  <Text key={i} style={{ fontSize: 8, color: '#B8D4E8', lineHeight: 1.6, marginBottom: 1 }}>
                    {item}
                  </Text>
                ))}
              </View>
            )}

            {/* Skills — individual pills */}
            {resume.skills?.length ? (
              <View style={{ marginBottom: 18 }}>
                <ModernSidebarHeading label="Skills" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {resume.skills.map((skill, i) => (
                    <View
                      key={i}
                      style={{
                        borderWidth: 0.5,
                        borderColor: LIGHT_BLUE,
                        borderRadius: 3,
                        paddingHorizontal: 5,
                        paddingVertical: 2,
                        marginRight: 3,
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ fontSize: 7, color: '#FFFFFF' }}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Education */}
            {resume.education?.length ? (
              <View style={{ marginBottom: 18 }}>
                <ModernSidebarHeading label="Education" />
                {resume.education.map((edu, i) => (
                  <View key={i} style={{ marginBottom: i < resume.education.length - 1 ? 8 : 0 }}>
                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', lineHeight: 1.35 }}>
                      {edu.institution}
                    </Text>
                    {edu.degree ? (
                      <Text style={{ fontSize: 7.5, color: '#B8D4E8', lineHeight: 1.35 }}>
                        {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                      </Text>
                    ) : null}
                    {edu.graduationDate ? (
                      <Text style={{ fontSize: 7, color: LIGHT_BLUE, marginTop: 1 }}>{edu.graduationDate}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            {/* Certifications */}
            {resume.certifications?.length ? (
              <View>
                <ModernSidebarHeading label="Certifications" />
                {resume.certifications.map((cert, i) => (
                  <View key={i} style={{ marginBottom: i < resume.certifications.length - 1 ? 6 : 0 }}>
                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', lineHeight: 1.35 }}>
                      {cert.name}
                    </Text>
                    {cert.issuer ? (
                      <Text style={{ fontSize: 7.5, color: '#B8D4E8' }}>
                        {cert.issuer}{cert.date ? ` · ${cert.date}` : ''}
                      </Text>
                    ) : cert.date ? (
                      <Text style={{ fontSize: 7.5, color: '#B8D4E8' }}>{cert.date}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* ── RIGHT MAIN COLUMN ── */}
          <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 32, paddingBottom: 28 }}>

            {resume.summary ? (
              <View style={{ marginBottom: 16 }}>
                <ModernMainHeading label="Summary" />
                <Text style={{ fontSize: 9.5, lineHeight: 1.6, color: '#333333' }}>{resume.summary}</Text>
              </View>
            ) : null}

            {resume.experience?.length ? (
              <View>
                <ModernMainHeading label="Experience" />
                {resume.experience.map((exp, i) => {
                  const dateStr = [exp.startDate, exp.endDate].filter(Boolean).join(' – ')
                  return (
                    <View key={i} style={{ marginBottom: i < resume.experience.length - 1 ? 10 : 0 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#111111', flex: 1 }}>
                          {exp.title || exp.company}
                        </Text>
                        {dateStr ? (
                          <Text style={{ fontSize: 8.5, color: '#888888', marginLeft: 8 }}>{dateStr}</Text>
                        ) : null}
                      </View>
                      {exp.title ? (
                        <Text style={{ fontSize: 8.5, color: NAVY, fontFamily: 'Helvetica-Bold', marginTop: 1, marginBottom: 4 }}>
                          {exp.company}
                        </Text>
                      ) : null}
                      {exp.bullets.map((b, j) => (
                        <View key={j} style={{ flexDirection: 'row', marginTop: 2, paddingLeft: 2 }}>
                          <Text style={{ fontSize: 9.5, width: 10, color: NAVY }}>›</Text>
                          <Text style={{ flex: 1, fontSize: 9.5, lineHeight: 1.45, color: '#333333' }}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  )
                })}
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  )
}

function ModernSidebarHeading({ label }: { label: string }) {
  return (
    <View style={{ marginBottom: 7 }}>
      <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', letterSpacing: 1.1, color: LIGHT_BLUE }}>
        {label.toUpperCase()}
      </Text>
      <View style={{ borderBottomWidth: 0.5, borderBottomColor: '#2A6BAF', marginTop: 3 }} />
    </View>
  )
}

function ModernMainHeading({ label }: { label: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY }}>{label}</Text>
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: NAVY, marginTop: 3 }} />
    </View>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// EXECUTIVE — Prestige single-column, Times-Roman serif, centered header
// ─────────────────────────────────────────────────────────────────────────────

const EXEC_ACCENT = '#1C1C1C'
const EXEC_MUTED  = '#555555'
const EXEC_RULE   = '#999999'

function ExecutivePDF({ resume }: { resume: StructuredResume }) {
  const contactItems = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
  ].filter(Boolean) as string[]

  return (
    <Document>
      <Page
        size="LETTER"
        style={{
          paddingTop: 40,
          paddingBottom: 40,
          paddingLeft: 56,
          paddingRight: 56,
          fontFamily: 'Times-Roman',
          fontSize: 10,
          color: '#2C2C2C',
          lineHeight: 1.45,
        }}
      >
        {/* ── Centered Prestige Header ── */}
        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          {/* Top double rule */}
          <View style={{ width: '100%', marginBottom: 10 }}>
            <View style={{ borderBottomWidth: 1.5, borderBottomColor: EXEC_ACCENT }} />
            <View style={{ borderBottomWidth: 0.4, borderBottomColor: EXEC_RULE, marginTop: 2.5 }} />
          </View>

          <Text style={{ fontSize: 23, fontFamily: 'Helvetica-Bold', color: EXEC_ACCENT, letterSpacing: 0.5, textAlign: 'center' }}>
            {resume.fullName}
          </Text>

          {resume.headline && !resume.headline.includes('@') ? (
            <Text style={{ fontSize: 10.5, color: EXEC_MUTED, fontFamily: 'Times-Italic', textAlign: 'center', marginTop: 4 }}>
              {resume.headline}
            </Text>
          ) : null}

          {contactItems.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
              {contactItems.map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {i > 0 && <Text style={{ fontSize: 7, color: '#AAAAAA', marginHorizontal: 6 }}>◆</Text>}
                  <Text style={{ fontSize: 8.5, color: EXEC_MUTED }}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Bottom double rule */}
          <View style={{ width: '100%', marginTop: 10 }}>
            <View style={{ borderBottomWidth: 1.5, borderBottomColor: EXEC_ACCENT }} />
            <View style={{ borderBottomWidth: 0.4, borderBottomColor: EXEC_RULE, marginTop: 2.5 }} />
          </View>
        </View>

        {/* ── Executive Profile ── */}
        {resume.summary ? (
          <View style={{ marginBottom: 12 }}>
            <ExecHeading label="EXECUTIVE PROFILE" />
            <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#2C2C2C', fontFamily: 'Times-Italic' }}>
              {resume.summary}
            </Text>
          </View>
        ) : null}

        {/* ── Professional Experience ── */}
        {resume.experience?.length ? (
          <View style={{ marginBottom: 12 }}>
            <ExecHeading label="PROFESSIONAL EXPERIENCE" />
            {resume.experience.map((exp, i) => {
              const dateStr = [exp.startDate, exp.endDate].filter(Boolean).join(' – ')
              return (
                <View key={i} style={{ marginBottom: i < resume.experience.length - 1 ? 10 : 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontFamily: 'Times-Bold', fontSize: 10.5, color: EXEC_ACCENT, flex: 1 }}>
                      {exp.company}
                    </Text>
                    {dateStr ? (
                      <Text style={{ fontSize: 8.5, color: EXEC_MUTED, marginLeft: 8 }}>{dateStr}</Text>
                    ) : null}
                  </View>
                  {exp.title ? (
                    <Text style={{ fontSize: 9.5, color: EXEC_MUTED, fontFamily: 'Times-Italic', marginTop: 1, marginBottom: 4 }}>
                      {exp.title}
                    </Text>
                  ) : null}
                  {exp.bullets.map((b, j) => (
                    <View key={j} style={{ flexDirection: 'row', marginTop: 2, paddingLeft: 4 }}>
                      <Text style={{ fontSize: 9.5, width: 12, color: EXEC_RULE }}>—</Text>
                      <Text style={{ flex: 1, fontSize: 10, lineHeight: 1.5, color: '#2C2C2C', fontFamily: 'Times-Roman' }}>{b}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>
        ) : null}

        {/* ── Areas of Expertise ── */}
        {resume.skills?.length ? (
          <View style={{ marginBottom: 12 }}>
            <ExecHeading label="AREAS OF EXPERTISE" />
            <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#2C2C2C', fontFamily: 'Times-Roman' }}>
              {resume.skills.join('   ·   ')}
            </Text>
          </View>
        ) : null}

        {/* ── Education ── */}
        {resume.education?.length ? (
          <View style={{ marginBottom: 12 }}>
            <ExecHeading label="EDUCATION" />
            {resume.education.map((edu, i) => (
              <View key={i} style={{ marginBottom: i < resume.education.length - 1 ? 6 : 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontFamily: 'Times-Bold', fontSize: 10.5, color: EXEC_ACCENT, flex: 1 }}>
                    {edu.institution}
                  </Text>
                  {edu.graduationDate ? (
                    <Text style={{ fontSize: 8.5, color: EXEC_MUTED }}>{edu.graduationDate}</Text>
                  ) : null}
                </View>
                {edu.degree ? (
                  <Text style={{ fontSize: 9.5, color: EXEC_MUTED, fontFamily: 'Times-Italic' }}>
                    {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Certifications ── */}
        {resume.certifications?.length ? (
          <View>
            <ExecHeading label="PROFESSIONAL CERTIFICATIONS" />
            {resume.certifications.map((cert, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: i < resume.certifications.length - 1 ? 4 : 0 }}>
                <Text style={{ fontFamily: 'Times-Bold', fontSize: 10, color: EXEC_ACCENT, flex: 1 }}>
                  {cert.name}
                </Text>
                <Text style={{ fontSize: 8.5, color: EXEC_MUTED }}>
                  {[cert.issuer, cert.date].filter(Boolean).join(' · ')}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  )
}

function ExecHeading({ label }: { label: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1.6, color: EXEC_ACCENT }}>
        {label}
      </Text>
      <View style={{ borderBottomWidth: 1.2, borderBottomColor: EXEC_ACCENT, marginTop: 3 }} />
      <View style={{ borderBottomWidth: 0.4, borderBottomColor: EXEC_RULE, marginTop: 2 }} />
    </View>
  )
}
