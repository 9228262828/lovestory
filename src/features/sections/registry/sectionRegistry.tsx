import type { ComponentType } from 'react'
import { PlaceholderSection } from '@/features/sections/components/sections/PlaceholderSection'
import type { RomanticSection } from '@/types/section'

type SectionComponent = ComponentType<{ section: RomanticSection }>

const sectionRegistry: Record<string, SectionComponent> = {
  hero: PlaceholderSection,
  story: PlaceholderSection,
  timeline: PlaceholderSection,
  gallery: PlaceholderSection,
  custom: PlaceholderSection,
}

export const getSectionComponent = (type: string): SectionComponent => {
  return sectionRegistry[type] ?? PlaceholderSection
}
