import type { JsonValue, RomanticSection } from '@/types/section'

type BackgroundMode = 'gradient' | 'image'

export interface CinematicIntroContent {
  title: string
  subtitle: string
  buttonText: string
  audioUrl: string
  backgroundMode: BackgroundMode
  showParticles: boolean
  typingSpeed: number
  overlayOpacity: number
  enableGlow: boolean
  enableMusic: boolean
  autoPlayMusic: boolean
}

export const defaultCinematicIntroContent: CinematicIntroContent = {
  title: 'Ahmed has something to tell Asmaa...',
  subtitle: '27 June changed everything.',
  buttonText: 'Enter Our World ✨',
  audioUrl: '',
  backgroundMode: 'image',
  showParticles: true,
  typingSpeed: 50,
  overlayOpacity: 0.55,
  enableGlow: true,
  enableMusic: true,
  autoPlayMusic: true,
}

const isRecord = (value: JsonValue): value is Record<string, JsonValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getString = (value: JsonValue | undefined, fallback: string): string => {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

const getOptionalString = (value: JsonValue | undefined): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const getBoolean = (value: JsonValue | undefined, fallback: boolean): boolean => {
  return typeof value === 'boolean' ? value : fallback
}

const getNumber = (
  value: JsonValue | undefined,
  fallback: number,
  min: number,
  max: number,
): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.min(Math.max(value, min), max)
}

const getBackgroundMode = (value: JsonValue | undefined, fallback: BackgroundMode): BackgroundMode => {
  return value === 'gradient' || value === 'image' ? value : fallback
}

export const resolveCinematicIntroContentFromRawContent = (rawContent: JsonValue): CinematicIntroContent => {
  if (!isRecord(rawContent)) {
    return defaultCinematicIntroContent
  }

  return {
    title: getString(rawContent.title, defaultCinematicIntroContent.title),
    subtitle: getString(rawContent.subtitle, defaultCinematicIntroContent.subtitle),
    buttonText: getString(rawContent.buttonText, defaultCinematicIntroContent.buttonText),
    audioUrl: getOptionalString(rawContent.audioUrl),
    backgroundMode: getBackgroundMode(rawContent.backgroundMode, defaultCinematicIntroContent.backgroundMode),
    showParticles: getBoolean(rawContent.showParticles, defaultCinematicIntroContent.showParticles),
    typingSpeed: getNumber(rawContent.typingSpeed, defaultCinematicIntroContent.typingSpeed, 15, 250),
    overlayOpacity: getNumber(rawContent.overlayOpacity, defaultCinematicIntroContent.overlayOpacity, 0.2, 0.85),
    enableGlow: getBoolean(rawContent.enableGlow, defaultCinematicIntroContent.enableGlow),
    enableMusic: getBoolean(rawContent.enableMusic, defaultCinematicIntroContent.enableMusic),
    autoPlayMusic: getBoolean(rawContent.autoPlayMusic, defaultCinematicIntroContent.autoPlayMusic),
  }
}

export const resolveCinematicIntroContent = (section: RomanticSection): CinematicIntroContent => {
  return resolveCinematicIntroContentFromRawContent(section.content)
}
