import { useCallback, useMemo, useRef, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import type { JsonValue, RomanticSection } from '@/types/section'

interface KissCounterSectionProps {
  section: RomanticSection
}

interface KissCounterContent {
  title: string
  subtitle: string
  buttonLabel: string
  counterLabel: string
  initialCount: number
}

interface FloatingHeart {
  id: number
  originX: number
  originY: number
  driftX: number
  riseY: number
  duration: number
  size: number
  rotate: number
}

const MAX_ACTIVE_HEARTS = 24
const HEARTS_PER_CLICK = 3
const sectionEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

const isRecord = (value: JsonValue): value is Record<string, JsonValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getString = (value: JsonValue | undefined, fallback: string): string => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

const getNumber = (value: JsonValue | undefined, fallback: number, minimum: number, maximum: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(minimum, Math.min(maximum, value))
}

const resolveKissCounterContent = (section: RomanticSection): KissCounterContent => {
  if (!isRecord(section.content)) {
    return {
      title: section.title || 'Kiss Counter',
      subtitle: 'Count every sweet little kiss and watch the love float up.',
      buttonLabel: 'Send a Kiss',
      counterLabel: 'Kisses shared',
      initialCount: 0,
    }
  }

  return {
    title: getString(section.content.title, section.title || 'Kiss Counter'),
    subtitle: getString(section.content.subtitle, 'Count every sweet little kiss and watch the love float up.'),
    buttonLabel: getString(section.content.buttonLabel, 'Send a Kiss'),
    counterLabel: getString(section.content.counterLabel, 'Kisses shared'),
    initialCount: getNumber(section.content.initialCount, 0, 0, 1_000_000),
  }
}

const randomBetween = (minimum: number, maximum: number): number => {
  return minimum + Math.random() * (maximum - minimum)
}

const buildHearts = (originX: number, originY: number, total: number, idStart: number): FloatingHeart[] => {
  return Array.from({ length: total }, (_, index) => ({
    id: idStart + index,
    originX,
    originY,
    driftX: randomBetween(-95, 95),
    riseY: randomBetween(120, 220),
    duration: randomBetween(0.95, 1.7),
    size: randomBetween(18, 34),
    rotate: randomBetween(-20, 20),
  }))
}

export const KissCounterSection = ({ section }: KissCounterSectionProps) => {
  const reduceMotion = useReducedMotion()
  const pulseControls = useAnimationControls()
  const rootRef = useRef<HTMLElement | null>(null)
  const nextHeartIdRef = useRef(1)
  const content = useMemo(() => resolveKissCounterContent(section), [section])
  const [kissCount, setKissCount] = useState(content.initialCount)
  const [hearts, setHearts] = useState<FloatingHeart[]>([])

  const removeHeart = useCallback((heartId: number) => {
    setHearts((existingHearts) => existingHearts.filter((heart) => heart.id !== heartId))
  }, [])

  const handleKissClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const sectionRect = rootRef.current?.getBoundingClientRect()
      if (!sectionRect) {
        return
      }

      setKissCount((previousCount) => previousCount + 1)

      const originX = event.clientX - sectionRect.left
      const originY = event.clientY - sectionRect.top
      const heartsPerClick = reduceMotion ? 1 : HEARTS_PER_CLICK + Math.round(Math.random())
      const heartBatch = buildHearts(originX, originY, heartsPerClick, nextHeartIdRef.current)
      nextHeartIdRef.current += heartBatch.length

      setHearts((existingHearts) => [...existingHearts, ...heartBatch].slice(-MAX_ACTIVE_HEARTS))

      void pulseControls.start(
        reduceMotion
          ? {
              scale: [1, 1.01, 1],
              transition: { duration: 0.14, ease: 'easeOut' },
            }
          : {
              scale: [1, 1.03, 1],
              x: [0, -1.5, 1.5, 0],
              transition: { duration: 0.24, ease: 'easeOut' },
            },
      )
    },
    [pulseControls, reduceMotion],
  )

  return (
    <motion.section
      ref={rootRef}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: sectionEase }}
      className="relative overflow-hidden rounded-[2rem] border border-rose-100/65 bg-gradient-to-br from-rose-100/70 via-pink-100/55 to-orange-100/50 px-5 py-7 shadow-[0_28px_65px_-48px_rgba(244,63,94,0.75)] sm:px-8 sm:py-9"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(251,113,133,0.22),transparent_44%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_82%,rgba(244,114,182,0.2),transparent_36%)]" />

      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.span
            key={heart.id}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 select-none"
            style={{ fontSize: `${heart.size}px`, lineHeight: 1 }}
            initial={{
              x: heart.originX - heart.size / 2,
              y: heart.originY - heart.size / 2,
              opacity: 0,
              scale: 0.55,
              rotate: heart.rotate - 4,
            }}
            animate={{
              x: heart.originX + heart.driftX,
              y: heart.originY - heart.riseY,
              opacity: [0, 0.95, 0],
              scale: [0.55, 1.07, 0.82],
              rotate: heart.rotate,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: heart.duration, ease: sectionEase }}
            onAnimationComplete={() => {
              removeHeart(heart.id)
            }}
          >
            ❤️
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.div animate={pulseControls} className="relative z-10 mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600/80">Kiss Counter</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{content.title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-700 sm:text-base">{content.subtitle}</p>

        <div className="mx-auto mt-7 w-full max-w-sm rounded-3xl border border-rose-100/70 bg-white/70 p-5 shadow-inner shadow-rose-200/40 sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-rose-600/85">{content.counterLabel}</p>
          <p className="mt-3 text-4xl font-semibold leading-none text-zinc-900 sm:text-5xl">{kissCount}</p>
          <motion.button
            type="button"
            onClick={handleKissClick}
            whileTap={{ scale: reduceMotion ? 0.995 : 0.97 }}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-rose-300/75 bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(244,63,94,0.95)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/75"
          >
            {content.buttonLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.section>
  )
}
