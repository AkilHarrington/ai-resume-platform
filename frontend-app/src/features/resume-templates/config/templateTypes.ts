export type ResumeSectionKey =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'certifications'

export type HeadingStyle = 'uppercase' | 'titlecase'
export type SpacingDensity = 'compact' | 'comfortable' | 'premium'
export type SkillsStyle = 'list' | 'inline-pills' | 'pipe-separated'
export type ExperienceLayout = 'standard' | 'title-first' | 'stacked'

export interface ResumeTemplateConfig {
  id: 'professional' | 'modern' | 'executive'
  label: string
  headingStyle: HeadingStyle
  spacingDensity: SpacingDensity
  skillsStyle: SkillsStyle
  experienceLayout: ExperienceLayout
  sectionOrder: ResumeSectionKey[]
}