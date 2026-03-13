import type {
  ResumeEducationItem,
  ResumeExperienceItem,
  StructuredResume,
} from '../../../types/resumeSchema'

const SECTION_HEADINGS = new Set([
  'summary',
  'skills',
  'experience',
  'education',
  'certifications',
])

function normalizeLine(line: string): string {
  return line.replace(/\u2014/g, '—').trim()
}

function isSectionHeading(line: string): boolean {
  return SECTION_HEADINGS.has(line.toLowerCase())
}

function isBullet(line: string): boolean {
  return line.startsWith('•') || line.startsWith('-')
}

export function parseResumeText(content: string): StructuredResume {
  const rawLines = content
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean)

  const fullName = rawLines[0] ?? ''
  const headline = rawLines[1] ?? ''

  const resume: StructuredResume = {
    fullName,
    headline,
    contact: {},
    summary: '',
    skills: [],
    experience: [],
    education: [],
    certifications: [],
  }

  let index = 2

  while (index < rawLines.length && !isSectionHeading(rawLines[index])) {
    const line = rawLines[index]

    if (line.includes('@')) {
      resume.contact.email = line
    } else if (!resume.contact.location) {
      resume.contact.location = line
    }

    index += 1
  }

  let currentSection: string | null = null
  let currentExperience: ResumeExperienceItem | null = null
  let pendingEducationInstitution: string | null = null

  while (index < rawLines.length) {
    const line = rawLines[index]

    if (isSectionHeading(line)) {
      if (currentExperience) {
        resume.experience.push(currentExperience)
        currentExperience = null
      }

      currentSection = line.toLowerCase()
      index += 1
      continue
    }

    if (currentSection === 'summary') {
      resume.summary = resume.summary
        ? `${resume.summary} ${line}`
        : line
      index += 1
      continue
    }

    if (currentSection === 'skills') {
      if (!isBullet(line)) {
        resume.skills.push(line)
      }
      index += 1
      continue
    }

    if (currentSection === 'experience') {
      if (isBullet(line)) {
        if (!currentExperience) {
          currentExperience = {
            company: '',
            title: '',
            bullets: [],
          }
        }

        currentExperience.bullets.push(line.replace(/^[•-]\s*/, ''))
        index += 1
        continue
      }

      const nextLine = rawLines[index + 1]
      const nextNextLine = rawLines[index + 2]

      if (
        !currentExperience ||
        (currentExperience.company && currentExperience.title && currentExperience.bullets.length > 0)
      ) {
        if (currentExperience) {
          resume.experience.push(currentExperience)
        }

        currentExperience = {
          company: line,
          title: '',
          bullets: [],
        }

        if (nextLine && !isSectionHeading(nextLine) && !isBullet(nextLine)) {
          currentExperience.title = nextLine
          index += 2

          if (nextNextLine && /^\d{4}/.test(nextNextLine)) {
            index += 1
          }

          continue
        }

        index += 1
        continue
      }

      if (!currentExperience.title) {
        currentExperience.title = line
        index += 1
        continue
      }

      index += 1
      continue
    }

    if (currentSection === 'education') {
      if (!pendingEducationInstitution) {
        pendingEducationInstitution = line
      } else {
        const educationItem: ResumeEducationItem = {
          institution: pendingEducationInstitution,
          degree: line,
        }
        resume.education.push(educationItem)
        pendingEducationInstitution = null
      }

      index += 1
      continue
    }

    if (currentSection === 'certifications') {
      resume.certifications.push({ name: line })
      index += 1
      continue
    }

    index += 1
  }

  if (currentExperience) {
    resume.experience.push(currentExperience)
  }

  if (pendingEducationInstitution) {
    resume.education.push({ institution: pendingEducationInstitution })
  }

  return resume
}