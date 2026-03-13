import { executiveTemplate } from './executiveTemplate'
import { modernTemplate } from './modernTemplate'
import { professionalTemplate } from './professionalTemplate'
import type { ResumeTemplateConfig } from './templateTypes'

export const templateConfigMap: Record<string, ResumeTemplateConfig> = {
  professional: professionalTemplate,
  modern: modernTemplate,
  executive: executiveTemplate,
}