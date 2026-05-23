import type { ComponentType } from 'react'
import { CinematicIntroSection } from '@/features/sections/components/sections/CinematicIntroSection'
import { PlaceholderSection } from '@/features/sections/components/sections/PlaceholderSection'
import type { RomanticSection } from '@/types/section'

type SectionComponent = ComponentType<{ section: RomanticSection }>

const sectionRegistry = new Map<string, SectionComponent>([
  ['hero', PlaceholderSection],
  ['story', PlaceholderSection],
  ['timeline', PlaceholderSection],
  ['gallery', PlaceholderSection],
  ['custom', PlaceholderSection],
  ['cinematic-intro', CinematicIntroSection],
])

export const registerSectionType = (type: string, component: SectionComponent) => {
  sectionRegistry.set(type, component)
}

export const getRegisteredSectionTypes = (): string[] => {
  return Array.from(sectionRegistry.keys())
}

const defaultRegistryFallback: Record<string, SectionComponent> = {
  hero: PlaceholderSection,
  story: PlaceholderSection,
  timeline: PlaceholderSection,
  gallery: PlaceholderSection,
  custom: PlaceholderSection,
  'cinematic-intro': CinematicIntroSection,
}

export const getSectionComponent = (type: string): SectionComponent => {
  return sectionRegistry.get(type) ?? defaultRegistryFallback[type] ?? PlaceholderSection
}
