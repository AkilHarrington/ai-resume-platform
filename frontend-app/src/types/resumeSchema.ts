export interface ResumeContact {
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  portfolio?: string
}

export interface ResumeExperienceItem {
  company: string
  title: string
  startDate?: string
  endDate?: string
  location?: string
  bullets: string[]
}

export interface ResumeEducationItem {
  institution: string
  degree?: string
  fieldOfStudy?: string
  graduationDate?: string
  location?: string
}

export interface ResumeCertificationItem {
  name: string
  issuer?: string
  date?: string
}

export interface StructuredResume {
  fullName: string
  headline?: string
  contact: ResumeContact
  summary?: string
  skills: string[]
  experience: ResumeExperienceItem[]
  education: ResumeEducationItem[]
  certifications: ResumeCertificationItem[]
}