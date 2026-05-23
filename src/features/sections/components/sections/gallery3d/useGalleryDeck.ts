import { useCallback, useMemo, useState } from 'react'
import type { ThreeDGalleryCard } from '@/features/sections/components/sections/gallery3d/content'

export interface GalleryCardLayout {
  id: string
  x: number
  y: number
  rotateZ: number
  tiltX: number
  tiltY: number
  zIndex: number
  floatDuration: number
  floatDelay: number
}

const seededRandom = (seed: number): number => {
  const value = Math.sin(seed * 97.3141) * 43758.5453
  return value - Math.floor(value)
}

const buildCardLayout = (
  card: ThreeDGalleryCard,
  index: number,
  totalCards: number,
  isCompactViewport: boolean,
  deckDensity: number,
): GalleryCardLayout => {
  const spreadXBase = isCompactViewport ? 74 : 170
  const spreadYBase = isCompactViewport ? 50 : 98
  const spreadX = spreadXBase + spreadXBase * 0.55 * deckDensity
  const spreadY = spreadYBase + spreadYBase * 0.5 * deckDensity
  const stackStep = (isCompactViewport ? 8 : 16) * (1 + 0.25 * deckDensity)
  const stackOffset = (index - (totalCards - 1) / 2) * stackStep
  const baseSeed = index + card.id.length * 0.17 + totalCards * 1.9

  return {
    id: card.id,
    x: (seededRandom(baseSeed) - 0.5) * spreadX * 2 + stackOffset,
    y: (seededRandom(baseSeed + 1) - 0.5) * spreadY * 2 + (index % 2 === 0 ? -6 : 10),
    rotateZ: (seededRandom(baseSeed + 2) - 0.5) * (isCompactViewport ? 10 : 18),
    tiltX: -6 + seededRandom(baseSeed + 3) * 12,
    tiltY: -7 + seededRandom(baseSeed + 4) * 14,
    zIndex: totalCards + index,
    floatDuration: 6 + seededRandom(baseSeed + 5) * 3,
    floatDelay: seededRandom(baseSeed + 6) * 1.6,
  }
}

export const useGalleryDeck = (cards: ThreeDGalleryCard[], isCompactViewport: boolean, deckDensity: number) => {
  const cardLayouts = useMemo(() => {
    return cards.map((card, index) => buildCardLayout(card, index, cards.length, isCompactViewport, deckDensity))
  }, [cards, deckDensity, isCompactViewport])

  const [flippedCardIds, setFlippedCardIds] = useState<Record<string, true>>({})

  const toggleCardFlip = useCallback((cardId: string) => {
    setFlippedCardIds((previousMap) => {
      if (previousMap[cardId]) {
        const nextMap = { ...previousMap }
        delete nextMap[cardId]
        return nextMap
      }

      return {
        ...previousMap,
        [cardId]: true,
      }
    })
  }, [])

  const isCardFlipped = useCallback(
    (cardId: string) => {
      return Boolean(flippedCardIds[cardId])
    },
    [flippedCardIds],
  )

  return { cardLayouts, toggleCardFlip, isCardFlipped }
}
