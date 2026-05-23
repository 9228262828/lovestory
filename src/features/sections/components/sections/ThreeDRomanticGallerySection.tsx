import { useMemo, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Gallery3DCard } from '@/features/sections/components/sections/gallery3d/Gallery3DCard'
import { resolveThreeDGalleryContent } from '@/features/sections/components/sections/gallery3d/content'
import { useGalleryDeck } from '@/features/sections/components/sections/gallery3d/useGalleryDeck'
import { useIsCompactViewport } from '@/features/sections/components/sections/gallery3d/useIsCompactViewport'
import type { RomanticSection } from '@/types/section'

interface ThreeDRomanticGallerySectionProps {
  section: RomanticSection
}

interface ParticleState {
  id: number
  left: string
  top: string
  duration: number
  delay: number
  scale: number
  opacity: number
}

const buildParticles = (count: number): ParticleState[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 8 + Math.random() * 9,
    delay: Math.random() * 2.5,
    scale: 0.65 + Math.random() * 1.35,
    opacity: 0.12 + Math.random() * 0.4,
  }))
}

const sectionEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const ThreeDRomanticGallerySection = ({ section }: ThreeDRomanticGallerySectionProps) => {
  const reduceMotion = useReducedMotion()
  const isCompactViewport = useIsCompactViewport()
  const dragBoundsRef = useRef<HTMLDivElement | null>(null)
  const content = useMemo(() => resolveThreeDGalleryContent(section), [section])
  const particles = useMemo(() => {
    if (!content.enableParticles) {
      return []
    }

    return buildParticles(content.particleCount)
  }, [content.enableParticles, content.particleCount])
  const { cardLayouts, toggleCardFlip, isCardFlipped } = useGalleryDeck(content.cards, isCompactViewport)

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.7, ease: sectionEase }}
      className="relative overflow-hidden rounded-[2rem] border border-rose-100/60 bg-gradient-to-br from-rose-100/65 via-pink-100/45 to-orange-100/50 px-4 py-7 shadow-[0_30px_70px_-50px_rgba(236,72,153,0.8)] sm:px-7 sm:py-9"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_18%,rgba(251,113,133,0.24),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_82%,rgba(244,114,182,0.2),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.4),rgba(255,255,255,0.06)_45%,rgba(255,255,255,0.2))]" />

      {content.enableParticles ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="absolute h-2 w-2 rounded-full bg-rose-50/80"
              style={{
                left: particle.left,
                top: particle.top,
                opacity: particle.opacity,
                filter: 'blur(0.4px)',
              }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [-8, 10, -8],
                      x: [-2, 3, -2],
                      scale: [particle.scale, particle.scale + 0.25, particle.scale],
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : {
                      duration: particle.duration,
                      delay: particle.delay,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }
              }
            />
          ))}
        </div>
      ) : null}

      <div className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600/80">3D Romantic Gallery</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{content.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-700 sm:text-base">{content.subtitle}</p>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.24em] text-rose-700/75 sm:text-xs">
            Tap or click cards to flip • Drag to explore
          </p>
        </div>

        <div
          ref={dragBoundsRef}
          className="relative mt-8 min-h-[24rem] w-full overflow-hidden rounded-[1.65rem] border border-white/40 bg-white/22 p-4 shadow-inner shadow-rose-200/35 backdrop-blur-[1.5px] [perspective:1400px] sm:mt-10 sm:min-h-[32rem] sm:p-6"
        >
          {content.cards.map((card, index) => {
            const layout = cardLayouts[index]

            if (!layout) {
              return null
            }

            return (
              <Gallery3DCard
                key={card.id}
                card={card}
                layout={layout}
                index={index}
                isFlipped={isCardFlipped(card.id)}
                reduceMotion={reduceMotion}
                isCompactViewport={isCompactViewport}
                dragConstraints={dragBoundsRef}
                onToggleFlip={toggleCardFlip}
              />
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}
