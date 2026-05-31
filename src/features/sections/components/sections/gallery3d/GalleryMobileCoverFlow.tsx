import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { ThreeDGalleryCard } from '@/features/sections/components/sections/gallery3d/content'

interface GalleryMobileCoverFlowProps {
  cards: ThreeDGalleryCard[]
  reduceMotion: boolean | null
}

type CardPosition = -1 | 0 | 1

const easing: [number, number, number, number] = [0.22, 1, 0.36, 1]
const SWIPE_DISTANCE_THRESHOLD = 72
const SWIPE_VELOCITY_THRESHOLD = 560
const SIDE_OFFSET = 134

const normalizeIndex = (value: number, total: number): number => {
  if (total <= 0) {
    return 0
  }

  return ((value % total) + total) % total
}

const resolveCardPosition = (index: number, activeIndex: number, total: number): CardPosition | null => {
  if (total <= 0) {
    return null
  }

  if (index === activeIndex) {
    return 0
  }

  if (total === 2) {
    const siblingIndex = normalizeIndex(activeIndex + 1, total)
    return index === siblingIndex ? 1 : null
  }

  const previousIndex = normalizeIndex(activeIndex - 1, total)
  if (index === previousIndex) {
    return -1
  }

  const nextIndex = normalizeIndex(activeIndex + 1, total)
  if (index === nextIndex) {
    return 1
  }

  return null
}

const renderCardFace = (card: ThreeDGalleryCard) => {
  if (card.type === 'image') {
    const imageAlt = card.caption ? card.caption : 'Gallery memory'

    return (
      <>
        <img src={card.imageUrl} alt={imageAlt} className="h-full w-full rounded-[1.1rem] object-cover" loading="lazy" />
        {card.caption ? (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl border border-rose-100/35 bg-zinc-950/45 px-3 py-2 text-left backdrop-blur-sm">
            <p className="text-sm font-medium text-rose-50">{card.caption}</p>
          </div>
        ) : null}
      </>
    )
  }

  if (card.type === 'quote') {
    return (
      <div className="flex h-full flex-col justify-center rounded-[1.1rem] border border-rose-100/30 bg-gradient-to-br from-rose-200/35 via-pink-200/25 to-fuchsia-200/15 px-5 py-6">
        <span className="text-2xl text-rose-500/70" aria-hidden>
          "
        </span>
        <p className="mt-2 text-balance text-base font-medium italic text-zinc-800">{card.quote}</p>
        <span className="mt-5 text-xs uppercase tracking-[0.26em] text-rose-600/85">quote</span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col justify-center rounded-[1.1rem] border border-rose-100/30 bg-gradient-to-br from-rose-100/90 via-pink-100/85 to-orange-100/80 px-5 py-6">
      <span className="text-xs font-semibold uppercase tracking-[0.26em] text-rose-600/80">message</span>
      <p className="mt-4 text-balance text-lg font-semibold leading-relaxed text-zinc-800">{card.message}</p>
    </div>
  )
}

const resolveAnimation = (position: CardPosition) => {
  if (position === 0) {
    return {
      x: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      opacity: 1,
      filter: 'blur(0px)',
      zIndex: 30,
    }
  }

  if (position === -1) {
    return {
      x: -SIDE_OFFSET,
      rotateY: 23,
      rotateZ: -5,
      scale: 0.82,
      opacity: 0.72,
      filter: 'blur(0.55px)',
      zIndex: 20,
    }
  }

  return {
    x: SIDE_OFFSET,
    rotateY: -23,
    rotateZ: 5,
    scale: 0.82,
    opacity: 0.72,
    filter: 'blur(0.55px)',
    zIndex: 20,
  }
}

export const GalleryMobileCoverFlow = memo(({ cards, reduceMotion }: GalleryMobileCoverFlowProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const totalCards = cards.length

  useEffect(() => {
    setActiveIndex((previousIndex) => normalizeIndex(previousIndex, totalCards))
  }, [totalCards])

  const isReducedMotion = Boolean(reduceMotion)
  const canNavigate = totalCards > 1
  const activeCard = cards[activeIndex]

  const goToRelativeIndex = useCallback(
    (delta: number) => {
      if (!canNavigate) {
        return
      }

      setActiveIndex((previousIndex) => normalizeIndex(previousIndex + delta, totalCards))
    },
    [canNavigate, totalCards],
  )

  const handleSwipeEnd = useCallback(
    (_: PointerEvent, info: PanInfo) => {
      if (!canNavigate) {
        return
      }

      const movedFarEnough = Math.abs(info.offset.x) > SWIPE_DISTANCE_THRESHOLD
      const movedFastEnough = Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD

      if (!movedFarEnough && !movedFastEnough) {
        return
      }

      if (info.offset.x < 0 || info.velocity.x < 0) {
        goToRelativeIndex(1)
        return
      }

      goToRelativeIndex(-1)
    },
    [canNavigate, goToRelativeIndex],
  )

  const visibleCards = useMemo(() => {
    return cards
      .map((card, index) => ({
        card,
        index,
        position: resolveCardPosition(index, activeIndex, totalCards),
      }))
      .filter((item): item is { card: ThreeDGalleryCard; index: number; position: CardPosition } => item.position !== null)
  }, [activeIndex, cards, totalCards])

  if (totalCards === 0 || !activeCard) {
    return null
  }

  return (
    <div className="space-y-4">
      <div
        className="relative mx-auto h-[19rem] w-full overflow-hidden rounded-[1.45rem] border border-white/40 bg-white/22 p-2 shadow-inner shadow-rose-200/35 backdrop-blur-[1.5px] [perspective:1200px]"
        role="group"
        aria-label="Cover flow gallery"
      >
        {visibleCards.map(({ card, index, position }) => {
          const animation = resolveAnimation(position)
          const isCenter = position === 0

          return (
            <motion.article
              key={card.id}
              className="absolute left-1/2 top-1/2 h-[16.2rem] w-[min(74vw,16.8rem)] -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none rounded-[1.25rem] border border-rose-100/55 bg-white/70 p-2 shadow-[0_24px_55px_-26px_rgba(217,70,109,0.65)] backdrop-blur-sm"
              style={{ transformStyle: 'preserve-3d' }}
              drag={isCenter && canNavigate ? 'x' : false}
              dragElastic={0.18}
              dragConstraints={{ left: 0, right: 0 }}
              dragMomentum={false}
              onDragEnd={handleSwipeEnd}
              onTap={() => {
                if (!isCenter) {
                  goToRelativeIndex(position)
                }
              }}
              initial={false}
              animate={animation}
              transition={{
                duration: isReducedMotion ? 0.14 : 0.42,
                ease: easing,
              }}
              aria-label={`Gallery card ${index + 1}`}
              aria-current={isCenter}
            >
              {renderCardFace(card)}
            </motion.article>
          )
        })}
      </div>

      {activeCard.type === 'image' && activeCard.caption ? (
        <motion.p
          key={activeCard.id}
          initial={isReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isReducedMotion ? 0.12 : 0.28, ease: easing }}
          className="text-center text-sm text-zinc-700"
        >
          {activeCard.caption}
        </motion.p>
      ) : null}

      <div className="flex items-center justify-center gap-2">
        {cards.map((card, index) => {
          const isActive = index === activeIndex

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setActiveIndex(index)
              }}
              className={`h-2.5 rounded-full transition ${isActive ? 'w-6 bg-rose-500' : 'w-2.5 bg-rose-200/90 hover:bg-rose-300'}`}
              aria-label={`Go to card ${index + 1}`}
              aria-current={isActive}
            />
          )
        })}
      </div>
    </div>
  )
})

GalleryMobileCoverFlow.displayName = 'GalleryMobileCoverFlow'
