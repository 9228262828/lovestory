import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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
  rotateStart: number
  rotateEnd: number
  size: number
}

const MAX_PARTICLES = 24
const BASE_PARTICLES_PER_KISS = 3
const MAX_PARTICLES_PER_BATCH = 18
const PARTICLE_EMOJIS = ['❤️', '💕', '💖', '💗', '✨', '😘', '😍'] as const
const motionEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

const randomBetween = (minimum: number, maximum: number): number => {
  return minimum + Math.random() * (maximum - minimum)
}

const clamp = (value: number, minimum: number, maximum: number): number => {
  return Math.max(minimum, Math.min(maximum, value))
}

const buildParticleBatch = (
  events: KissEvent[],
  idStart: number,
  reduceMotion: boolean,
): { particles: KissParticle[]; nextId: number } => {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 720
  const maxDrift = clamp(viewportWidth * 0.07, 24, 110)
  const maxRise = clamp(viewportHeight * 0.34, 120, 280)
  const particles: KissParticle[] = []
  let nextId = idStart

  for (const event of events) {
    const multiplier = Math.max(1, Math.round(event.value))
    const totalForEvent = reduceMotion
      ? 1
      : Math.min(5, BASE_PARTICLES_PER_KISS + Math.floor(Math.random() * 2)) * multiplier

    for (let index = 0; index < totalForEvent; index += 1) {
      if (particles.length >= MAX_PARTICLES_PER_BATCH) {
        return { particles, nextId }
      }

      const emojiIndex = Math.floor(Math.random() * PARTICLE_EMOJIS.length)
      const rotateEnd = randomBetween(-20, 20)

      particles.push({
        id: nextId,
        emoji: PARTICLE_EMOJIS[emojiIndex],
        startX: randomBetween(8, 92),
        startY: randomBetween(62, 97),
        driftX: randomBetween(-maxDrift, maxDrift),
        riseY: randomBetween(maxRise * 0.55, maxRise),
        duration: reduceMotion ? randomBetween(0.55, 0.8) : randomBetween(1.2, 2.1),
        rotateStart: rotateEnd - randomBetween(5, 10),
        rotateEnd,
        size: randomBetween(18, 32),
      })
      nextId += 1
    }
  }

  return { particles, nextId }
}

interface KissParticleSpriteProps {
  particle: KissParticle
  onComplete: (id: number) => void
}

const KissParticleSprite = memo(({ particle, onComplete }: KissParticleSpriteProps) => {
  return (
    <motion.span
      className="absolute select-none will-change-transform"
      style={{
        left: `${particle.startX}%`,
        top: `${particle.startY}%`,
        fontSize: `${particle.size}px`,
        lineHeight: 1,
      }}
      initial={{
        opacity: 0,
        scale: 0.72,
        x: 0,
        y: 0,
        rotate: particle.rotateStart,
      }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0.72, 1.05, 0.86],
        x: particle.driftX,
        y: -particle.riseY,
        rotate: particle.rotateEnd,
      }}
      transition={{ duration: particle.duration, ease: motionEase, type: 'tween' }}
      onAnimationComplete={() => {
        onComplete(particle.id)
      }}
    >
      {particle.emoji}
    </motion.span>
  )
})

KissParticleSprite.displayName = 'KissParticleSprite'

export const GlobalKissOverlay = () => {
  const reduceMotion = useReducedMotion()
  const [particles, setParticles] = useState<KissParticle[]>([])
  const nextParticleIdRef = useRef(1)
  const eventQueueRef = useRef<KissEvent[]>([])
  const eventFrameRef = useRef<number | null>(null)
  const removalQueueRef = useRef<number[]>([])
  const removalFrameRef = useRef<number | null>(null)

  const flushRemovalQueue = useCallback(() => {
    removalFrameRef.current = null

    if (removalQueueRef.current.length === 0) {
      return
    }

    const idsToRemove = new Set(removalQueueRef.current)
    removalQueueRef.current = []

    setParticles((current) => {
      if (current.length === 0) {
        return current
      }

      const hasMatch = current.some((particle) => idsToRemove.has(particle.id))
      if (!hasMatch) {
        return current
      }

      return current.filter((particle) => !idsToRemove.has(particle.id))
    })
  }, [])

  const queueParticleRemoval = useCallback(
    (id: number) => {
      removalQueueRef.current.push(id)

      if (removalFrameRef.current !== null) {
        return
      }

      removalFrameRef.current = window.requestAnimationFrame(flushRemovalQueue)
    },
    [flushRemovalQueue],
  )

  const flushEventQueue = useCallback(() => {
    eventFrameRef.current = null

    if (eventQueueRef.current.length === 0) {
      return
    }

    const events = eventQueueRef.current
    eventQueueRef.current = []

    const { particles: batch, nextId } = buildParticleBatch(events, nextParticleIdRef.current, Boolean(reduceMotion))
    if (batch.length === 0) {
      return
    }

    nextParticleIdRef.current = nextId
    setParticles((current) => [...current, ...batch].slice(-MAX_PARTICLES))
  }, [reduceMotion])

  const handleKissEvents = useCallback(
    (events: KissEvent[]) => {
      if (events.length === 0) {
        return
      }

      eventQueueRef.current.push(...events)

      if (eventFrameRef.current !== null) {
        return
      }

      eventFrameRef.current = window.requestAnimationFrame(flushEventQueue)
    },
    [flushEventQueue],
  )

  useEffect(() => {
    return () => {
      if (eventFrameRef.current !== null) {
        window.cancelAnimationFrame(eventFrameRef.current)
      }

      if (removalFrameRef.current !== null) {
        window.cancelAnimationFrame(removalFrameRef.current)
      }
    }
  }, [])

  useKissStream({ onKissEvents: handleKissEvents })

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden transform-gpu" aria-hidden>
      {particles.map((particle) => (
        <KissParticleSprite key={particle.id} particle={particle} onComplete={queueParticleRemoval} />
      ))}
    </div>
  )
}
