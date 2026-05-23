import { memo, useCallback, useRef, type KeyboardEvent, type RefObject } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { ThreeDGalleryCard } from '@/features/sections/components/sections/gallery3d/content'
import type { GalleryCardLayout } from '@/features/sections/components/sections/gallery3d/useGalleryDeck'

interface Gallery3DCardProps {
  card: ThreeDGalleryCard
  layout: GalleryCardLayout
  index: number
  isFlipped: boolean
  reduceMotion: boolean | null
  isCompactViewport: boolean
  dragConstraints: RefObject<HTMLElement | null>
  sizeScale: number
  onToggleFlip: (cardId: string) => void
}

const easing: [number, number, number, number] = [0.22, 1, 0.36, 1]

const getBackMessage = (card: ThreeDGalleryCard): string => {
  if (card.type === 'image') {
    return 'Hold and drag this memory around our little world.'
  }

  if (card.type === 'quote') {
    return 'This line still gives me butterflies every single time.'
  }

  return 'Everything feels softer and brighter when we are together.'
}

const renderCardFront = (card: ThreeDGalleryCard, isCompactViewport: boolean) => {
  if (card.type === 'image') {
    return (
      <>
        <img src={card.imageUrl} alt={card.caption} className="h-full w-full rounded-[1.15rem] object-cover" loading="lazy" />
        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl border border-rose-100/35 bg-zinc-950/45 px-3 py-2 text-left backdrop-blur-sm">
          <p className="text-sm font-medium text-rose-50">{card.caption}</p>
        </div>
      </>
    )
  }

  if (card.type === 'quote') {
    return (
      <div className="flex h-full flex-col justify-center rounded-[1.15rem] border border-rose-100/30 bg-gradient-to-br from-rose-200/35 via-pink-200/25 to-fuchsia-200/15 px-5 py-6">
        <span className="text-2xl text-rose-500/70" aria-hidden>
          "
        </span>
        <p className={`mt-2 text-balance font-medium italic text-zinc-800 ${isCompactViewport ? 'text-base' : 'text-lg'}`}>
          {card.quote}
        </p>
        <span className="mt-5 text-xs uppercase tracking-[0.26em] text-rose-600/85">quote</span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col justify-center rounded-[1.15rem] border border-rose-100/30 bg-gradient-to-br from-rose-100/90 via-pink-100/85 to-orange-100/80 px-5 py-6">
      <span className="text-xs font-semibold uppercase tracking-[0.26em] text-rose-600/80">message</span>
      <p className={`mt-4 text-balance font-semibold leading-relaxed text-zinc-800 ${isCompactViewport ? 'text-lg' : 'text-xl'}`}>
        {card.message}
      </p>
    </div>
  )
}

const Gallery3DCardBase = ({
  card,
  layout,
  index,
  isFlipped,
  reduceMotion,
  isCompactViewport,
  dragConstraints,
  sizeScale,
  onToggleFlip,
}: Gallery3DCardProps) => {
  const didDragRef = useRef(false)
  const isReducedMotion = Boolean(reduceMotion)
  const sizeClasses = isCompactViewport ? 'h-[15.75rem] w-[min(80vw,15.75rem)]' : 'h-[19rem] w-[min(78vw,18rem)]'

  const handleToggleFlip = useCallback(() => {
    if (didDragRef.current) {
      return
    }

    onToggleFlip(card.id)
  }, [card.id, onToggleFlip])

  const handleDrag = useCallback((_: PointerEvent, info: PanInfo) => {
    if (didDragRef.current) {
      return
    }

    const dragDistance = Math.abs(info.offset.x) + Math.abs(info.offset.y)
    if (dragDistance > 6) {
      didDragRef.current = true
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    window.requestAnimationFrame(() => {
      didDragRef.current = false
    })
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return
      }

      event.preventDefault()
      onToggleFlip(card.id)
    },
    [card.id, onToggleFlip],
  )

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ zIndex: layout.zIndex }}
      initial={
        isReducedMotion
          ? { opacity: 1, x: layout.x, y: layout.y, scale: 1 }
          : { opacity: 0, x: layout.x, y: layout.y + 26, scale: 0.9 }
      }
      animate={
        isReducedMotion
          ? { opacity: 1, x: layout.x, y: layout.y, scale: 1 }
          : { opacity: 1, x: layout.x, y: [layout.y - 6, layout.y + 8, layout.y - 6], scale: 1 }
      }
      transition={
        isReducedMotion
          ? { duration: 0.18 }
          : {
              opacity: { duration: 0.45, delay: index * 0.08 },
              scale: { duration: 0.5, delay: index * 0.08, ease: easing },
              x: { duration: 0.75, delay: index * 0.04, ease: easing },
              y: {
                duration: layout.floatDuration,
                delay: layout.floatDelay,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              },
            }
      }
    >
      <motion.article
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.16}
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onTap={handleToggleFlip}
        role="button"
        tabIndex={0}
        aria-label={`Gallery card ${index + 1}`}
        aria-pressed={isFlipped}
        onKeyDown={handleKeyDown}
        className={`${sizeClasses} relative cursor-grab select-none rounded-[1.3rem] p-2 [touch-action:none] active:cursor-grabbing`}
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateX: layout.tiltX,
          rotateY: isFlipped ? 180 + layout.tiltY : layout.tiltY,
          rotateZ: layout.rotateZ,
          scale: sizeScale,
        }}
        whileHover={isReducedMotion ? undefined : { scale: Math.min(sizeScale + 0.03, 1.04), rotateZ: layout.rotateZ + 2 }}
        whileDrag={{ scale: Math.min(sizeScale + 0.05, 1.08), rotateZ: 0 }}
        transition={{
          type: 'tween',
          duration: isReducedMotion ? 0.16 : 0.34,
          ease: easing,
        }}
      >
        <div
          className="absolute inset-0 rounded-[1.25rem] border border-rose-100/55 bg-white/70 shadow-[0_24px_55px_-26px_rgba(217,70,109,0.65)] backdrop-blur-sm [backface-visibility:hidden]"
          style={{ transform: 'translateZ(26px)' }}
        >
          {renderCardFront(card, isCompactViewport)}
        </div>

        <div
          className="absolute inset-0 flex flex-col justify-between rounded-[1.25rem] border border-rose-100/60 bg-gradient-to-br from-fuchsia-950/92 via-rose-950/90 to-zinc-950/95 p-4 text-rose-50 shadow-[0_20px_45px_-28px_rgba(236,72,153,0.75)] [backface-visibility:hidden]"
          style={{ transform: 'rotateY(180deg) translateZ(26px)' }}
        >
          <span className="text-xs uppercase tracking-[0.27em] text-rose-200/80">for us</span>
          <p className={`text-balance font-medium leading-relaxed ${isCompactViewport ? 'text-sm' : 'text-base'}`}>
            {getBackMessage(card)}
          </p>
          <p className="text-[11px] uppercase tracking-[0.26em] text-rose-200/75">tap to flip back</p>
        </div>
      </motion.article>
    </motion.div>
  )
}

export const Gallery3DCard = memo(Gallery3DCardBase)
