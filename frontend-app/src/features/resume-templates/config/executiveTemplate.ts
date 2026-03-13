import type { ResumeTemplateConfig } from './templateTypes'

export const executiveTemplate: ResumeTemplateConfig = {
  id: 'executive',
  label: 'Executive',
  headingStyle: 'uppercase',
  spacingDensity: 'premium',
  skillsStyle: 'pipe-separated',
  experienceLayout: 'stacked',
  sectionOrder: ['summary', 'experience', 'skills', 'education', 'certifications'],
}