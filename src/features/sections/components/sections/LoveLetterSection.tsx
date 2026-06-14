import { memo, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { JsonValue, RomanticSection } from '@/types/section'

interface LoveLetterSectionProps {
  section: RomanticSection
}

interface LoveLetterContent {
  title: string
  buttonText: string
  letter: string
  signature: string
  showParticles: boolean
  enableGlow: boolean
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

const defaultContent: LoveLetterContent = {
  title: 'A Letter To Asmaa',
  buttonText: 'Open My Letter',
  letter: 'My love, from the first day I knew you, everything became different...',
  signature: 'Forever yours, Ahmed',
  showParticles: true,
  enableGlow: true,
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

const resolveLoveLetterContent = (section: RomanticSection): LoveLetterContent => {
  if (!isRecord(section.content)) {
    return {
      ...defaultContent,
      title: section.title || defaultContent.title,
    }
  }

  return {
    title: getString(section.content.title, section.title || defaultContent.title),
    buttonText: getString(section.content.buttonText, defaultContent.buttonText),
    letter: getString(section.content.letter, defaultContent.letter),
    signature: getString(section.content.signature, defaultContent.signature),
    showParticles: getBoolean(section.content.showParticles, defaultContent.showParticles),
    enableGlow: getBoolean(section.content.enableGlow, defaultContent.enableGlow),
  }
}

const buildParticles = (): ParticleState[] => {
  return Array.from({ length: 16 }, (_, index) => ({
    id: index,
    left: `${(index * 37 + 13) % 100}%`,
    top: `${(index * 53 + 19) % 100}%`,
    size: 4 + ((index * 5) % 9),
    duration: 8 + (index % 5),
    delay: (index % 6) * 0.28,
    opacity: 0.16 + (index % 4) * 0.08,
  }))
}

const splitLetterIntoLines = (letter: string): string[] => {
  const explicitLines = letter
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (explicitLines.length > 1) {
    return explicitLines
  }

  const words = (explicitLines[0] ?? letter.trim()).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const nextLine = currentLine.length > 0 ? `${currentLine} ${word}` : word

    if (nextLine.length > 88 && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = word
      return
    }

    currentLine = nextLine
  })

  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : [defaultContent.letter]
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
            filter: 'blur(0.6px)',
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [-7, 9, -7],
                  x: [-2, 2, -2],
                  scale: [1, 1.26, 1],
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

ParticleLayer.displayName = 'LoveLetterParticleLayer'

export const LoveLetterSection = ({ section }: LoveLetterSectionProps) => {
  const reduceMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(false)
  const content = useMemo(() => resolveLoveLetterContent(section), [section])
  const letterLines = useMemo(() => splitLetterIntoLines(content.letter), [content.letter])
  const particles = useMemo(() => (content.showParticles ? buildParticles() : []), [content.showParticles])
  const animationDuration = reduceMotion ? 0.01 : 0.72

  return (
    <motion.section
      initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.7, ease: sectionEase }}
      className={`relative -mx-4 overflow-hidden bg-gradient-to-br from-rose-950 via-pink-950 to-zinc-950 px-4 py-8 text-white shadow-[0_30px_90px_-58px_rgba(244,63,94,0.9)] sm:mx-0 sm:rounded-[2rem] sm:px-8 sm:py-11 lg:px-10 ${
        content.enableGlow ? 'shadow-rose-500/30' : ''
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(251,113,133,0.34),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_78%,rgba(244,114,182,0.24),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),transparent_44%,rgba(255,255,255,0.06))]" />

      {content.showParticles ? <ParticleLayer particles={particles} reduceMotion={reduceMotion} /> : null}

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.18 : 0.5, ease: sectionEase }}
            className="text-[11px] font-semibold uppercase tracking-[0.34em] text-rose-100/70 sm:text-xs"
          >
            Love Letter
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.65, delay: reduceMotion ? 0 : 0.08, ease: sectionEase }}
            className={`mt-4 text-3xl font-semibold leading-tight tracking-tight text-rose-50 sm:text-5xl lg:text-6xl ${
              content.enableGlow ? '[text-shadow:0_0_34px_rgba(251,113,133,0.4)]' : ''
            }`}
          >
            {content.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.58, delay: reduceMotion ? 0 : 0.14, ease: sectionEase }}
            className="mx-auto mt-4 max-w-xl text-sm leading-6 text-rose-100/75 sm:text-base lg:mx-0"
          >
            A quiet promise folded for Asmaa, waiting to be opened by one gentle tap.
          </motion.p>
          <motion.button
            type="button"
            aria-expanded={isOpen}
            aria-controls={`love-letter-${section.id}`}
            onClick={() => {
              setIsOpen(true)
            }}
            whileTap={{ scale: reduceMotion ? 1 : 0.97 }}
            disabled={isOpen}
            className={`mt-7 inline-flex min-h-12 items-center justify-center rounded-full border border-rose-100/35 px-7 py-3 text-sm font-semibold text-rose-50 backdrop-blur-md transition hover:border-rose-100/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70 disabled:cursor-default disabled:opacity-80 sm:text-base ${
              content.enableGlow
                ? 'bg-white/12 shadow-[0_0_34px_rgba(251,113,133,0.32)] hover:shadow-[0_0_42px_rgba(251,113,133,0.42)]'
                : 'bg-white/8'
            }`}
          >
            {isOpen ? 'Letter Opened' : content.buttonText}
          </motion.button>
        </div>

        <div className="w-full">
          <motion.div
            className="relative mx-auto flex w-full max-w-3xl flex-col items-center"
            initial={false}
            animate={isOpen ? 'open' : 'closed'}
          >
            <div className="relative w-full max-w-xl pt-3 sm:pt-7 [perspective:1400px]">
              <div className="relative aspect-[1.36/1] w-full">
                <motion.div
                  className="absolute inset-x-[5%] bottom-[10%] h-[68%] rounded-b-[1.6rem] border border-rose-100/35 bg-gradient-to-br from-rose-200 via-pink-100 to-orange-100 shadow-[0_26px_60px_-38px_rgba(244,63,94,0.85)]"
                  variants={{
                    closed: { y: 0 },
                    open: { y: reduceMotion ? 0 : 10 },
                  }}
                  transition={{ duration: animationDuration, ease: sectionEase }}
                />
                <motion.div
                  className="absolute inset-x-[5%] bottom-[10%] h-[68%] rounded-b-[1.6rem] bg-gradient-to-tr from-rose-400/50 via-rose-100/30 to-transparent"
                  style={{ clipPath: 'polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)' }}
                  variants={{
                    closed: { opacity: 0.86 },
                    open: { opacity: 0.58 },
                  }}
                  transition={{ duration: animationDuration, ease: sectionEase }}
                />
                <motion.div
                  className="absolute inset-x-[5%] bottom-[44%] h-[36%] origin-bottom rounded-t-[1.4rem] border border-rose-100/35 bg-gradient-to-br from-rose-100 via-pink-100 to-rose-200 shadow-[0_16px_45px_-34px_rgba(255,255,255,0.85)]"
                  style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
                  variants={{
                    closed: { rotateX: 0, y: 0, zIndex: 7 },
                    open: { rotateX: reduceMotion ? 0 : -156, y: reduceMotion ? 0 : -4, zIndex: 2 },
                  }}
                  transition={{ duration: animationDuration, ease: sectionEase }}
                />
                <motion.div
                  className="absolute inset-x-[10%] bottom-[22%] h-[55%] rounded-t-[1.3rem] border border-rose-100/65 bg-rose-50 shadow-[0_22px_54px_-40px_rgba(255,255,255,0.95)]"
                  variants={{
                    closed: { opacity: 0, y: reduceMotion ? 0 : 70, scale: reduceMotion ? 1 : 0.92 },
                    open: { opacity: 1, y: reduceMotion ? 0 : -24, scale: 1 },
                  }}
                  transition={{
                    duration: reduceMotion ? 0.01 : 0.78,
                    delay: reduceMotion ? 0 : 0.16,
                    ease: sectionEase,
                  }}
                >
                  <div className="mx-auto mt-4 h-2 w-24 rounded-full bg-rose-200/80 sm:mt-6" />
                  <div className="mx-auto mt-3 h-2 w-36 rounded-full bg-pink-100 sm:mt-4" />
                </motion.div>
                <motion.div
                  className="absolute inset-x-[5%] bottom-[10%] h-[68%] rounded-b-[1.6rem] border border-rose-50/45 bg-gradient-to-tr from-rose-300 via-pink-100 to-orange-100"
                  style={{ clipPath: 'polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%)' }}
                  variants={{
                    closed: { y: 0 },
                    open: { y: reduceMotion ? 0 : 10 },
                  }}
                  transition={{ duration: animationDuration, ease: sectionEase }}
                />
                <div className="absolute bottom-[18%] left-1/2 h-10 w-10 -translate-x-1/2 rounded-full border border-rose-100/60 bg-gradient-to-br from-rose-500 to-pink-500 shadow-[0_10px_26px_-14px_rgba(244,63,94,0.95)] sm:h-12 sm:w-12" />
              </div>
            </div>

            <AnimatePresence>
              {isOpen ? (
                <motion.article
                  id={`love-letter-${section.id}`}
                  key="love-letter-card"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.62, delay: reduceMotion ? 0 : 0.32, ease: sectionEase }}
                  className={`-mt-4 w-full rounded-[1.8rem] border border-rose-100/70 bg-rose-50 px-5 py-7 text-left text-zinc-800 shadow-[0_28px_75px_-48px_rgba(255,255,255,0.85)] sm:-mt-8 sm:px-8 sm:py-9 lg:-mt-10 ${
                    content.enableGlow ? 'shadow-rose-200/40' : ''
                  }`}
                >
                  <div className="mx-auto max-w-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-500/85">From Ahmed</p>
                    <div className="mt-5 space-y-3 text-base leading-8 text-zinc-800 sm:text-lg sm:leading-9">
                      {letterLines.map((line, index) => (
                        <motion.p
                          key={`${line}-${index}`}
                          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: reduceMotion ? 0.01 : 0.45,
                            delay: reduceMotion ? 0 : 0.52 + index * 0.12,
                            ease: sectionEase,
                          }}
                        >
                          {line}
                        </motion.p>
                      ))}
                    </div>
                    <motion.p
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduceMotion ? 0.01 : 0.45,
                        delay: reduceMotion ? 0 : 0.58 + letterLines.length * 0.12,
                        ease: sectionEase,
                      }}
                      className="mt-7 text-right font-semibold italic text-rose-700 sm:text-lg"
                    >
                      {content.signature}
                    </motion.p>
                  </div>
                </motion.article>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
