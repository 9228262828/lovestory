import type { JsonValue, RomanticSection } from '@/types/section'

type BackgroundMode = 'gradient' | 'image'

export interface CinematicIntroContent {
  title: string
  subtitle: string
  buttonText: string
  backgroundMode: BackgroundMode
  showParticles: boolean
  typingSpeed: number
  overlayOpacity: number
  enableGlow: boolean
  enableMusic: boolean
  autoPlayMusic: boolean
}

const defaultContent: CinematicIntroContent = {
  title: 'Ahmed has something to tell Asmaa...',
  subtitle: '27 June changed everything.',
  buttonText: 'Enter Our World ✨',
  backgroundMode: 'image',
  showParticles: true,
  typingSpeed: 50,
  overlayOpacity: 0.55,
  enableGlow: true,
  enableMusic: true,
  autoPlayMusic: false,
}

const isRecord = (value: JsonValue): value is Record<string, JsonValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getString = (value: JsonValue | undefined, fallback: string): string => {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
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

export const resolveCinematicIntroContent = (section: RomanticSection): CinematicIntroContent => {
  const rawContent = section.content

  if (!isRecord(rawContent)) {
    return defaultContent
  }

  return {
    title: getString(rawContent.title, defaultContent.title),
    subtitle: getString(rawContent.subtitle, defaultContent.subtitle),
    buttonText: getString(rawContent.buttonText, defaultContent.buttonText),
    backgroundMode: getBackgroundMode(rawContent.backgroundMode, defaultContent.backgroundMode),
    showParticles: getBoolean(rawContent.showParticles, defaultContent.showParticles),
    typingSpeed: getNumber(rawContent.typingSpeed, defaultContent.typingSpeed, 15, 250),
    overlayOpacity: getNumber(rawContent.overlayOpacity, defaultContent.overlayOpacity, 0.2, 0.85),
    enableGlow: getBoolean(rawContent.enableGlow, defaultContent.enableGlow),
    enableMusic: getBoolean(rawContent.enableMusic, defaultContent.enableMusic),
    autoPlayMusic: getBoolean(rawContent.autoPlayMusic, defaultContent.autoPlayMusic),
  }
}
