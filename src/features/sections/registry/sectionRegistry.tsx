import type { ComponentType } from 'react'
import { CinematicIntroSection } from '@/features/sections/components/sections/CinematicIntroSection'
import { KissCounterSection } from '@/features/sections/components/sections/KissCounterSection'
import { LifeStartCounterSection } from '@/features/sections/components/sections/LifeStartCounterSection'
import { LoveLetterSection } from '@/features/sections/components/sections/LoveLetterSection'
import { PlaceholderSection } from '@/features/sections/components/sections/PlaceholderSection'
import { ReasonsILoveYouSection } from '@/features/sections/components/sections/ReasonsILoveYouSection'
import { ThreeDRomanticGallerySection } from '@/features/sections/components/sections/ThreeDRomanticGallerySection'
import { VoiceMessagesSection } from '@/features/sections/components/sections/VoiceMessagesSection'
import type { RomanticSection } from '@/types/section'

type SectionComponent = ComponentType<{ section: RomanticSection }>

const sectionRegistry = new Map<string, SectionComponent>([
  ['hero', PlaceholderSection],
  ['story', PlaceholderSection],
  ['timeline', PlaceholderSection],
  ['gallery', PlaceholderSection],
  ['custom', PlaceholderSection],
  ['cinematic-intro', CinematicIntroSection],
  ['3d-gallery', ThreeDRomanticGallerySection],
  ['kiss-counter', KissCounterSection],
  ['life-start-counter', LifeStartCounterSection],
  ['love-letter', LoveLetterSection],
  ['voice-messages', VoiceMessagesSection],
  ['reasons-i-love-you', ReasonsILoveYouSection],
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
  '3d-gallery': ThreeDRomanticGallerySection,
  'kiss-counter': KissCounterSection,
  'life-start-counter': LifeStartCounterSection,
  'love-letter': LoveLetterSection,
  'voice-messages': VoiceMessagesSection,
  'reasons-i-love-you': ReasonsILoveYouSection,
}

export const getSectionComponent = (type: string): SectionComponent => {
  return sectionRegistry.get(type) ?? defaultRegistryFallback[type] ?? PlaceholderSection
}
