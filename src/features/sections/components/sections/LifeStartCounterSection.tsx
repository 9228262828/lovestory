import { memo, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { JsonValue, RomanticSection } from '@/types/section'

interface LifeStartCounterSectionProps {
  section: RomanticSection
}

interface LifeStartCounterContent {
  title: string
  startDate: string
  subtitle: string
  showParticles: boolean
  enableGlow: boolean
}

interface CounterTotals {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface ParticleState {
  id: number
  left: string
  top: string
  size: number
  duration: number
  delay: number
  opacity: number
}

interface ParticleLayerProps {
  particles: ParticleState[]
  reduceMotion: boolean | null
}

const sectionEase: [number, number, number, number] = [0.22, 1, 0.36, 1]
const defaultStartDate = '2024-04-04T00:00:00'

const defaultContent: LifeStartCounterContent = {
  title: 'My real life started the day I met Asmaa.',
  startDate: defaultStartDate,
  subtitle: 'And since that day, every second has meant something.',
  showParticles: true,
  enableGlow: true,
}

const buildParticles = (): ParticleState[] => {
  return Array.from({ length: 18 }, (_, index) => ({
    id: index,
    left: `${(index * 29 + 11) % 100}%`,
    top: `${(index * 47 + 17) % 100}%`,
    size: 5 + ((index * 7) % 11),
    duration: 9 + (index % 6),
    delay: (index % 5) * 0.35,
    opacity: 0.18 + (index % 4) * 0.08,
  }))
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

const resolveStartTimestamp = (value: string): number => {
  const parsedDate = new Date(value)
  const parsedTimestamp = parsedDate.getTime()

  if (Number.isNaN(parsedTimestamp)) {
    return new Date(defaultStartDate).getTime()
  }

  return parsedTimestamp
}

const resolveLifeStartCounterContent = (section: RomanticSection): LifeStartCounterContent => {
  if (!isRecord(section.content)) {
    return {
      ...defaultContent,
      title: section.title || defaultContent.title,
    }
  }

  return {
    title: getString(section.content.title, section.title || defaultContent.title),
    startDate: getString(section.content.startDate, defaultContent.startDate),
    subtitle: getString(section.content.subtitle, defaultContent.subtitle),
    showParticles: getBoolean(section.content.showParticles, defaultContent.showParticles),
    enableGlow: getBoolean(section.content.enableGlow, defaultContent.enableGlow),
  }
}

const getCounterTotals = (startTimestamp: number, currentTimestamp: number): CounterTotals => {
  const elapsedSeconds = Math.max(0, Math.floor((currentTimestamp - startTimestamp) / 1000))

  return {
    days: Math.floor(elapsedSeconds / 86_400),
    hours: Math.floor(elapsedSeconds / 3_600),
    minutes: Math.floor(elapsedSeconds / 60),
    seconds: elapsedSeconds,
  }
}

const ParticleLayer = memo(({ particles, reduceMotion }: ParticleLayerProps) => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-rose-100/80 will-change-transform"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            filter: 'blur(0.5px)',
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [-8, 10, -8],
                  x: [-3, 3, -3],
                  scale: [1, 1.22, 1],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                  type: 'tween',
                }
          }
        />
      ))}
    </div>
  )
})

ParticleLayer.displayName = 'LifeStartCounterParticleLayer'

export const LifeStartCounterSection = ({ section }: LifeStartCounterSectionProps) => {
  const reduceMotion = useReducedMotion()
  const content = useMemo(() => resolveLifeStartCounterContent(section), [section])
  const startTimestamp = useMemo(() => resolveStartTimestamp(content.startDate), [content.startDate])
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now())
  const particles = useMemo(() => (content.showParticles ? buildParticles() : []), [content.showParticles])
  const numberFormatter = useMemo(() => new Intl.NumberFormat(), [])
  const totals = useMemo(() => getCounterTotals(startTimestamp, currentTimestamp), [currentTimestamp, startTimestamp])
  const formattedStartDate = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(startTimestamp))
  }, [startTimestamp])

  useEffect(() => {
    setCurrentTimestamp(Date.now())

    const intervalId = window.setInterval(() => {
      setCurrentTimestamp(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [startTimestamp])

  const counterItems = [
    { label: 'Total days', value: totals.days },
    { label: 'Total hours', value: totals.hours },
    { label: 'Total minutes', value: totals.minutes },
    { label: 'Total seconds', value: totals.seconds },
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.7, ease: sectionEase }}
      className={`relative overflow-hidden rounded-[2rem] border border-rose-100/70 bg-gradient-to-br from-rose-950 via-pink-950 to-zinc-950 px-4 py-8 text-white shadow-[0_30px_80px_-50px_rgba(244,63,94,0.95)] sm:px-8 sm:py-11 ${
        content.enableGlow ? 'shadow-rose-500/30' : ''
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(251,113,133,0.3),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_84%,rgba(244,114,182,0.24),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),transparent_42%,rgba(255,255,255,0.06))]" />

      {content.showParticles ? <ParticleLayer particles={particles} reduceMotion={reduceMotion} /> : null}

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.18 : 0.55, ease: sectionEase }}
          className="text-[11px] font-semibold uppercase tracking-[0.34em] text-rose-100/75 sm:text-xs"
        >
          Life Start Counter
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.7, delay: reduceMotion ? 0 : 0.08, ease: sectionEase }}
          className={`mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-rose-50 sm:text-5xl ${
            content.enableGlow ? '[text-shadow:0_0_34px_rgba(251,113,133,0.42)]' : ''
          }`}
        >
          {content.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.65, delay: reduceMotion ? 0 : 0.16, ease: sectionEase }}
          className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-6 text-rose-100/82 sm:text-lg"
        >
          {content.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.65, delay: reduceMotion ? 0 : 0.22, ease: sectionEase }}
          className={`mt-7 rounded-full border border-rose-100/25 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-50/90 backdrop-blur-md sm:mt-8 ${
            content.enableGlow ? 'shadow-[0_0_32px_rgba(251,113,133,0.2)]' : ''
          }`}
        >
          Since <time dateTime={content.startDate}>{formattedStartDate}</time>
        </motion.div>

        <div className="mt-7 grid w-full grid-cols-1 gap-3 sm:mt-9 sm:grid-cols-2 lg:grid-cols-4">
          {counterItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0.18 : 0.55,
                delay: reduceMotion ? 0 : 0.26 + index * 0.06,
                ease: sectionEase,
              }}
              className={`rounded-3xl border border-white/12 bg-white/10 p-5 text-left backdrop-blur-md sm:p-6 ${
                content.enableGlow ? 'shadow-[0_18px_45px_-34px_rgba(251,113,133,0.9)]' : ''
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-rose-100/65">{item.label}</p>
              <p className="mt-3 break-words text-4xl font-semibold leading-none tracking-tight text-white sm:text-5xl lg:text-4xl xl:text-5xl">
                {numberFormatter.format(item.value)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
