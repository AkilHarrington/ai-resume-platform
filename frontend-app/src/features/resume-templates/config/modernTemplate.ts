import type { ResumeTemplateConfig } from './templateTypes'

export const modernTemplate: ResumeTemplateConfig = {
  id: 'modern',
  label: 'Modern',
  headingStyle: 'titlecase',
  spacingDensity: 'comfortable',
  skillsStyle: 'inline-pills',
  experienceLayout: 'title-first',
  sectionOrder: ['summary', 'skills', 'experience', 'education', 'certifications'],
}