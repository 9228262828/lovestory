import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useKissStream } from '@/hooks/useKissStream'
import type { KissEvent } from '@/services/kiss.service'

interface KissParticle {
  id: number
  emoji: string
  startX: number
  startY: number
  driftX: number
  riseY: number
  duration: number
  rotate: number
  size: number
}

const MAX_PARTICLES = 36
const BASE_PARTICLES_PER_KISS = 3
const PARTICLE_EMOJIS = ['❤️', '💕', '💖', '💗', '✨', '😘', '😍'] as const
const motionEase: [number, number, number, number] = [0.2, 0.92, 0.38, 1]

const randomBetween = (minimum: number, maximum: number): number => {
  return minimum + Math.random() * (maximum - minimum)
}

const buildParticles = (event: KissEvent, idStart: number, reduceMotion: boolean): KissParticle[] => {
  const multiplier = Math.max(1, Math.round(event.value))
  const total = reduceMotion ? 1 : Math.min(6, BASE_PARTICLES_PER_KISS + Math.floor(Math.random() * 2)) * multiplier

  return Array.from({ length: total }, (_, index) => {
    const emojiIndex = Math.floor(Math.random() * PARTICLE_EMOJIS.length)

    return {
      id: idStart + index,
      emoji: PARTICLE_EMOJIS[emojiIndex],
      startX: randomBetween(8, 92),
      startY: randomBetween(62, 97),
      driftX: randomBetween(-13, 13),
      riseY: randomBetween(24, 44),
      duration: reduceMotion ? randomBetween(0.65, 0.95) : randomBetween(1.4, 2.4),
      rotate: randomBetween(-20, 20),
      size: randomBetween(18, 34),
    }
  })
}

export const GlobalKissOverlay = () => {
  const reduceMotion = useReducedMotion()
  const [particles, setParticles] = useState<KissParticle[]>([])
  const nextParticleIdRef = useRef(1)

  const removeParticle = useCallback((id: number) => {
    setParticles((current) => current.filter((particle) => particle.id !== id))
  }, [])

  const handleKissEvent = useCallback(
    (event: KissEvent) => {
      const batch = buildParticles(event, nextParticleIdRef.current, Boolean(reduceMotion))
      nextParticleIdRef.current += batch.length
      setParticles((current) => [...current, ...batch].slice(-MAX_PARTICLES))
    },
    [reduceMotion],
  )

  useKissStream({ onKissEvent: handleKissEvent })

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute select-none"
            style={{
              left: `${particle.startX}%`,
              top: `${particle.startY}%`,
              fontSize: `${particle.size}px`,
              lineHeight: 1,
            }}
            initial={{
              opacity: 0,
              scale: 0.6,
              x: '-50%',
              y: '-50%',
              rotate: particle.rotate - 6,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.6, 1.08, 0.84],
              x: ['-50%', `calc(-50% + ${particle.driftX}vw)`],
              y: ['-50%', `calc(-50% - ${particle.riseY}vh)`],
              rotate: particle.rotate,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: particle.duration, ease: motionEase }}
            onAnimationComplete={() => {
              removeParticle(particle.id)
            }}
          >
            {particle.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
