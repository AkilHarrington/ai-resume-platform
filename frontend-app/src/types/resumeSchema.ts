export interface ResumeContact {
  email?: string | null
  phone?: string | null
  location?: string | null
  linkedin?: string | null
  portfolio?: string | null
}

export interface ResumeExperienceItem {
  company: string
  title: string
  startDate?: string | null
  endDate?: string | null
  location?: string | null
  bullets: string[]
}

export interface ResumeEducationItem {
  institution: string
  degree?: string | null
  fieldOfStudy?: string | null
  graduationDate?: string | null
  location?: string | null
}

export interface ResumeCertificationItem {
  name: string
  issuer?: string | null
  date?: string | null
}

export interface ParsedResume {
  fullName: string
  headline?: string
  contact: ResumeContact
  summary: string
  skills: string[]
  experience: ResumeExperienceItem[]
  education: ResumeEducationItem[]
  certifications: ResumeCertificationItem[]
}

export type StructuredResume = ParsedResume