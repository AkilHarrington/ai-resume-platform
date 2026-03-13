import type { ResumeTemplateConfig } from './templateTypes'

export const professionalTemplate: ResumeTemplateConfig = {
  id: 'professional',
  label: 'Professional',
  headingStyle: 'uppercase',
  spacingDensity: 'compact',
  skillsStyle: 'list',
  experienceLayout: 'standard',
  sectionOrder: ['summary', 'skills', 'experience', 'education', 'certifications'],
}