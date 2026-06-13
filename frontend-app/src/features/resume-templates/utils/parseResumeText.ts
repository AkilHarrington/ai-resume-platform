// =========================================================
// parseResumeText.ts
// Converts plain-text resume (from upload or Claude output) into
// a StructuredResume for PDF rendering.
//
// Handles all section heading variants Claude produces:
//   PROFESSIONAL EXPERIENCE, EXECUTIVE PROFILE, AREAS OF EXPERTISE, etc.
// Properly splits contact lines: "email | phone | location"
// Properly splits comma-separated skills into individual items.
// =========================================================

import type {
  ResumeEducationItem,
  ResumeExperienceItem,
  StructuredResume,
} from '../../../types/resumeSchema'

// Map every heading variant Claude might output → canonical section key
const SECTION_MAP: Record<string, string> = {
  'summary':                       'summary',
  'profile':                       'summary',
  'professional summary':          'summary',
  'executive profile':             'summary',
  'executive summary':             'summary',
  'career summary':                'summary',
  'career objective':              'summary',
  'about':                         'summary',

  'skills':                        'skills',
  'core competencies':             'skills',
  'competencies':                  'skills',
  'areas of expertise':            'skills',
  'key skills':                    'skills',
  'technical skills':              'skills',
  'capabilities':                  'skills',
  'expertise':                     'skills',
  'skills & expertise':            'skills',
  'skills and expertise':          'skills',

  'experience':                    'experience',
  'professional experience':       'experience',
  'work experience':               'experience',
  'career history':                'experience',
  'employment':                    'experience',
  'employment history':            'experience',
  'relevant experience':           'experience',

  'education':                     'education',
  'education & credentials':       'education',
  'education and credentials':     'education',
  'academic background':           'education',

  'certifications':                'certifications',
  'professional certifications':   'certifications',
  'licenses & certifications':     'certifications',
  'licenses and certifications':   'certifications',
  'credentials':                   'certifications',
}

function getSectionKey(line: string): string | null {
  const key = line
    .toLowerCase()
    .trim()
    .replace(/[:\s]+$/, '')       // strip trailing colon / whitespace
    .replace(/[_\-]+/g, ' ')      // normalise dashes/underscores
  return SECTION_MAP[key] ?? null
}

function isBullet(line: string): boolean {
  return /^[•\-–—›»*]/.test(line.trim())
}

function stripBullet(line: string): string {
  return line.replace(/^[•\-–—›»*]\s*/, '').trim()
}

// Returns true if the line looks like a contact/header line
function isContactLine(line: string): boolean {
  return line.includes('@') || /\(\d{3}\)|\d{3}[.\-\s]\d{3}/.test(line)
}

// Split a combined "email | phone | city, ST | linkedin" contact line
function splitContactLine(line: string) {
  const parts = line.split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean)
  const result: { email?: string; phone?: string; location?: string; linkedin?: string } = {}
  for (const part of parts) {
    if (part.includes('@')) {
      result.email = part
    } else if (/linkedin\.com/i.test(part)) {
      result.linkedin = part
    } else if (/\d{3}/.test(part) && /\d{4}/.test(part)) {
      result.phone = part
    } else if (!result.location) {
      result.location = part
    }
  }
  return result
}

// Parse "Company | Title | 2020 – Present" style experience headers
function parseExpHeader(line: string): ResumeExperienceItem | null {
  if (!line.includes('|')) return null
  const parts = line.split(/\s*\|\s*/).map(s => s.trim())
  if (parts.length < 2) return null

  const company = parts[0]
  const title   = parts[1]
  const dateStr = parts[2] ?? ''
  // Split on em-dash, en-dash, or hyphen
  const dateParts = dateStr.split(/\s*[–—\-]\s*/).map(s => s.trim())

  return {
    company,
    title,
    startDate: dateParts[0] || undefined,
    endDate:   dateParts[1] || undefined,
    bullets:   [],
  }
}

function isExpHeader(line: string): boolean {
  return (
    line.includes('|') &&
    !line.includes('@') &&
    !/linkedin\.com/i.test(line)
  )
}

export function parseResumeText(content: string): StructuredResume {
  const lines = content
    .split('\n')
    .map(l => l.replace(/—/g, '—').trim())
    .filter(Boolean)

  const resume: StructuredResume = {
    fullName: '',
    headline: '',
    contact: {},
    summary: '',
    skills: [],
    experience: [],
    education: [],
    certifications: [],
  }

  if (lines.length === 0) return resume

  // ── Line 0: always the candidate's name ──────────────────
  resume.fullName = lines[0]

  let idx = 1

  // ── Header block: collect contact info before first section ──
  while (idx < lines.length) {
    const line = lines[idx]
    if (getSectionKey(line)) break  // first recognised section heading

    if (isContactLine(line)) {
      const c = splitContactLine(line)
      if (c.email)    resume.contact.email    = c.email
      if (c.phone)    resume.contact.phone    = c.phone
      if (c.location) resume.contact.location = c.location
      if (c.linkedin) resume.contact.linkedin = c.linkedin
    } else if (/linkedin\.com/i.test(line)) {
      resume.contact.linkedin = line
    } else if (line.length < 80 && !resume.headline) {
      // Short non-contact line (job title / tagline) → treat as headline
      resume.headline = line
    }
    idx++
  }

  // ── Section body ─────────────────────────────────────────
  let currentSection: string | null = null
  let currentExp: ResumeExperienceItem | null = null
  const summaryLines: string[] = []

  const flushExp = () => {
    if (currentExp && (currentExp.company || currentExp.bullets.length > 0)) {
      resume.experience.push(currentExp)
      currentExp = null
    }
  }

  while (idx < lines.length) {
    const line = lines[idx]
    const sectionKey = getSectionKey(line)

    if (sectionKey) {
      flushExp()
      currentSection = sectionKey
      idx++
      continue
    }

    // ── Summary ──────────────────────────────────────────────
    if (currentSection === 'summary') {
      summaryLines.push(line)
      idx++
      continue
    }

    // ── Skills ───────────────────────────────────────────────
    if (currentSection === 'skills') {
      if (!isBullet(line)) {
        // Split comma-separated list into individual skill tags
        const parts = line.split(/,\s*/).map(s => s.trim()).filter(Boolean)
        if (parts.length > 1) {
          resume.skills.push(...parts)
        } else {
          resume.skills.push(line)
        }
      }
      idx++
      continue
    }

    // ── Experience ───────────────────────────────────────────
    if (currentSection === 'experience') {
      if (isBullet(line)) {
        if (!currentExp) currentExp = { company: '', title: '', bullets: [] }
        currentExp.bullets.push(stripBullet(line))
        idx++
        continue
      }

      if (isExpHeader(line)) {
        flushExp()
        currentExp = parseExpHeader(line) ?? { company: line, title: '', bullets: [] }
        idx++
        continue
      }

      // Plain text in experience block (secondary role on same line, orphaned title, etc.)
      if (currentExp && !currentExp.title) {
        currentExp.title = line
      }
      idx++
      continue
    }

    // ── Education ────────────────────────────────────────────
    if (currentSection === 'education') {
      if (line.includes('|')) {
        const parts = line.split(/\s*\|\s*/).map(s => s.trim())
        const yearPart = parts.find(p => /^\d{4}$/.test(p))
        const nonYear = parts.filter(p => !/^\d{4}$/.test(p))
        const edu: ResumeEducationItem = {
          institution:    nonYear[0] ?? parts[0],
          degree:         nonYear[1],
          fieldOfStudy:   nonYear[2],
          graduationDate: yearPart,
        }
        resume.education.push(edu)
      } else {
        resume.education.push({ institution: line })
      }
      idx++
      continue
    }

    // ── Certifications ───────────────────────────────────────
    if (currentSection === 'certifications') {
      if (!isBullet(line)) {
        const parts = line.split(/\s*\|\s*/).map(s => s.trim())
        resume.certifications.push({
          name:   parts[0],
          issuer: parts[1],
          date:   parts[2],
        })
      }
      idx++
      continue
    }

    idx++
  }

  flushExp()
  if (summaryLines.length > 0) resume.summary = summaryLines.join(' ')

  return resume
}
