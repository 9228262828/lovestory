import type { JsonValue, RomanticSection } from '@/types/section'

type GalleryCardType = 'image' | 'message' | 'quote'

interface GalleryCardBase {
  id: string
  type: GalleryCardType
}

export interface GalleryImageCard extends GalleryCardBase {
  type: 'image'
  imageUrl: string
  caption: string
}

export interface GalleryMessageCard extends GalleryCardBase {
  type: 'message'
  message: string
}

export interface GalleryQuoteCard extends GalleryCardBase {
  type: 'quote'
  quote: string
}

export type ThreeDGalleryCard = GalleryImageCard | GalleryMessageCard | GalleryQuoteCard

export interface ThreeDGalleryContent {
  title: string
  subtitle: string
  enableParticles: boolean
  particleCount: number
  cards: ThreeDGalleryCard[]
}

const MAX_CARD_COUNT = 20

const defaultCards: ThreeDGalleryCard[] = [
  {
    id: 'default-image-card',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?auto=format&fit=crop&w=900&q=80',
    caption: 'Our favorite moment',
  },
  {
    id: 'default-message-card',
    type: 'message',
    message: 'You make my world brighter.',
  },
  {
    id: 'default-quote-card',
    type: 'quote',
    quote: 'Some people feel like home.',
  },
]

const defaultContent: ThreeDGalleryContent = {
  title: 'Our Little World ✨',
  subtitle: 'Every memory with you feels magical.',
  enableParticles: true,
  particleCount: 14,
  cards: defaultCards,
}

const isRecord = (value: JsonValue): value is Record<string, JsonValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getString = (value: JsonValue | undefined, fallback: string): string => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

const getBoolean = (value: JsonValue | undefined, fallback: boolean): boolean => {
  return typeof value === 'boolean' ? value : fallback
}

const getNumber = (
  value: JsonValue | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(minimum, Math.min(maximum, value))
}

const getCardType = (value: JsonValue | undefined): GalleryCardType | null => {
  return value === 'image' || value === 'message' || value === 'quote' ? value : null
}

const buildCardId = (rawCard: Record<string, JsonValue>, fallback: string): string => {
  const normalizedId = getString(rawCard.id, '')
  return normalizedId.length > 0 ? normalizedId : fallback
}

const normalizeCards = (rawCards: JsonValue | undefined, sectionImageUrl: string | null): ThreeDGalleryCard[] => {
  if (!Array.isArray(rawCards)) {
    return defaultCards
  }

  const normalized = rawCards
    .slice(0, MAX_CARD_COUNT)
    .map((rawCard, index): ThreeDGalleryCard | null => {
      if (!isRecord(rawCard)) {
        return null
      }

      const cardType = getCardType(rawCard.type)
      if (!cardType) {
        return null
      }

      const fallbackCardId = `${cardType}-${index + 1}`
      const id = buildCardId(rawCard, fallbackCardId)

      if (cardType === 'image') {
        // Keep compatibility with current upload flow by falling back to section.image_url.
        const imageUrl = getString(rawCard.imageUrl, sectionImageUrl ?? '')
        if (imageUrl.length === 0) {
          return null
        }

        return {
          id,
          type: 'image',
          imageUrl,
          caption: getString(rawCard.caption, 'A moment to hold close forever.'),
        }
      }

      if (cardType === 'message') {
        return {
          id,
          type: 'message',
          message: getString(rawCard.message, 'You are my favorite feeling.'),
        }
      }

      return {
        id,
        type: 'quote',
        quote: getString(rawCard.quote, 'Love makes ordinary moments feel golden.'),
      }
    })
    .filter((card): card is ThreeDGalleryCard => card !== null)

  return normalized.length > 0 ? normalized : defaultCards
}

export const resolveThreeDGalleryContent = (section: RomanticSection): ThreeDGalleryContent => {
  const rawContent = section.content

  if (!isRecord(rawContent)) {
    return defaultContent
  }

  return {
    title: getString(rawContent.title, defaultContent.title),
    subtitle: getString(rawContent.subtitle, defaultContent.subtitle),
    enableParticles: getBoolean(rawContent.enableParticles, defaultContent.enableParticles),
    particleCount: getNumber(rawContent.particleCount, defaultContent.particleCount, 6, 20),
    cards: normalizeCards(rawContent.cards, section.image_url),
  }
}
