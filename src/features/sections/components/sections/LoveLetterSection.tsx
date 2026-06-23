import { memo, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { getSectionDisplayLabel } from '@/features/sections/utils/sectionDisplayLabel'
import type { JsonValue, RomanticSection } from '@/types/section'

interface LoveLetterSectionProps {
  section: RomanticSection
}

type PaperStyle = 'classic' | 'blush' | 'midnight'

interface LoveLetterContent {
  title: string
  introText: string
  buttonText: string
  letter: string
  signature: string
  paperStyle: PaperStyle
  showMusic: boolean
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
  introText: 'There are words I kept close to my heart, folded carefully, waiting for the right moment to reach you.',
  buttonText: 'Open My Letter',
  letter: 'My love, from the first day I knew you, everything became different...',
  signature: 'Forever yours, Ahmed',
  paperStyle: 'classic',
  showMusic: false,
  showParticles: true,
  enableGlow: true,
}

const paperStyles: Record<
  PaperStyle,
  {
    article: string
    surface: string
    ink: string
    muted: string
    rule: string
    signature: string
  }
> = {
  classic: {
    article: 'border-rose-100/80 bg-[#fff8ef] text-stone-900 shadow-[0_35px_90px_-55px_rgba(120,53,15,0.75)]',
    surface:
      'bg-[radial-gradient(circle_at_20%_12%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,241,242,0.94))]',
    ink: 'text-stone-800',
    muted: 'text-rose-700/75',
    rule: 'border-rose-200/70',
    signature: 'text-rose-800',
  },
  blush: {
    article: 'border-pink-100/85 bg-rose-50 text-zinc-900 shadow-[0_35px_90px_-55px_rgba(190,24,93,0.78)]',
    surface:
      'bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.9),transparent_30%),linear-gradient(135deg,rgba(255,241,242,0.98),rgba(252,231,243,0.94))]',
    ink: 'text-zinc-800',
    muted: 'text-pink-700/75',
    rule: 'border-pink-200/80',
    signature: 'text-pink-800',
  },
  midnight: {
    article: 'border-rose-100/25 bg-zinc-950 text-rose-50 shadow-[0_35px_90px_-55px_rgba(251,113,133,0.7)]',
    surface:
      'bg-[radial-gradient(circle_at_18%_10%,rgba(251,113,133,0.18),transparent_30%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(49,22,44,0.96))]',
    ink: 'text-rose-50/88',
    muted: 'text-rose-100/62',
    rule: 'border-rose-100/15',
    signature: 'text-rose-100',
  },
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

const getPaperStyle = (value: JsonValue | undefined): PaperStyle => {
  if (value === 'blush' || value === 'midnight' || value === 'classic') {
    return value
  }

  return defaultContent.paperStyle
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
    introText: getString(section.content.introText, defaultContent.introText),
    buttonText: getString(section.content.buttonText, defaultContent.buttonText),
    letter: getString(section.content.letter, defaultContent.letter),
    signature: getString(section.content.signature, defaultContent.signature),
    paperStyle: getPaperStyle(section.content.paperStyle),
    showMusic: getBoolean(section.content.showMusic, defaultContent.showMusic),
    showParticles: getBoolean(section.content.showParticles, defaultContent.showParticles),
    enableGlow: getBoolean(section.content.enableGlow, defaultContent.enableGlow),
  }
}

const buildParticles = (): ParticleState[] => {
  return Array.from({ length: 18 }, (_, index) => ({
    id: index,
    left: `${(index * 37 + 11) % 100}%`,
    top: `${(index * 53 + 17) % 100}%`,
    size: 4 + ((index * 5) % 10),
    duration: 9 + (index % 6),
    delay: (index % 7) * 0.24,
    opacity: 0.14 + (index % 4) * 0.08,
  }))
}

const getLetterParagraphs = (letter: string): string[] => {
  const normalizedLetter = letter.replace(/\r\n/g, '\n').trim()

  if (normalizedLetter.length === 0) {
    return [defaultContent.letter]
  }

  const paragraphBreaks = normalizedLetter
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  if (paragraphBreaks.length > 0) {
    return paragraphBreaks
  }

  return [normalizedLetter]
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
            filter: 'blur(0.65px)',
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [-8, 11, -8],
                  x: [-2, 3, -2],
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

ParticleLayer.displayName = 'LoveLetterParticleLayer'

export const LoveLetterSection = ({ section }: LoveLetterSectionProps) => {
  const reduceMotion = useReducedMotion()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [musicError, setMusicError] = useState<string | null>(null)
  const content = useMemo(() => resolveLoveLetterContent(section), [section])
  const displayLabel = useMemo(() => getSectionDisplayLabel(section), [section])
  const paragraphs = useMemo(() => getLetterParagraphs(content.letter), [content.letter])
  const particles = useMemo(() => (content.showParticles ? buildParticles() : []), [content.showParticles])
  const selectedPaperStyle = paperStyles[content.paperStyle]
  const canUseMusic = content.showMusic && Boolean(section.music_url)
  const duration = reduceMotion ? 0.01 : 0.82

  const handleOpenLetter = () => {
    setIsOpen(true)
  }

  const handleMusicToggle = async () => {
    if (!audioRef.current) {
      return
    }

    if (audioRef.current.paused) {
      try {
        await audioRef.current.play()
        setMusicError(null)
        setIsMusicPlaying(true)
      } catch {
        setMusicError('Tap again if your browser needs a direct sound gesture.')
        setIsMusicPlaying(false)
      }
      return
    }

    audioRef.current.pause()
    setIsMusicPlaying(false)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.7, ease: sectionEase }}
      className={`relative -mx-4 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.32),transparent_36%),linear-gradient(135deg,#25061a_0%,#4a1236_48%,#09090b_100%)] px-4 py-10 text-white shadow-[0_36px_100px_-60px_rgba(244,63,94,0.95)] sm:mx-0 sm:rounded-[2.25rem] sm:px-8 sm:py-12 lg:px-10 ${
        content.enableGlow ? 'shadow-rose-500/30' : ''
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(244,114,182,0.22),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),transparent_38%,rgba(255,255,255,0.05))]" />
      {content.showParticles ? <ParticleLayer particles={particles} reduceMotion={reduceMotion} /> : null}

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 lg:min-h-[42rem] lg:flex-row lg:items-center lg:gap-12">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="love-letter-closed"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -16, scale: reduceMotion ? 1 : 0.98 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.55, ease: sectionEase }}
              className="grid w-full gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center"
            >
              <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
                {displayLabel ? (
                  <motion.p
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.45, ease: sectionEase }}
                    className="text-[11px] font-semibold uppercase tracking-[0.38em] text-rose-100/72 sm:text-xs"
                  >
                    {displayLabel}
                  </motion.p>
                ) : null}
                <motion.h2
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.62, delay: reduceMotion ? 0 : 0.08, ease: sectionEase }}
                  className={`${displayLabel ? 'mt-4' : ''} text-4xl font-semibold leading-[1.04] tracking-tight text-rose-50 sm:text-5xl lg:text-7xl ${
                    content.enableGlow ? '[text-shadow:0_0_34px_rgba(251,113,133,0.42)]' : ''
                  }`}
                >
                  {content.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.58, delay: reduceMotion ? 0 : 0.16, ease: sectionEase }}
                  className="mx-auto mt-5 max-w-xl text-base leading-8 text-rose-50/78 sm:text-lg lg:mx-0"
                >
                  {content.introText}
                </motion.p>
                <motion.button
                  type="button"
                  aria-expanded={false}
                  aria-controls={`love-letter-${section.id}`}
                  onClick={handleOpenLetter}
                  whileTap={{ scale: reduceMotion ? 1 : 0.97 }}
                  className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-full border border-rose-100/38 px-8 py-3 text-sm font-semibold tracking-wide text-rose-50 backdrop-blur-md transition hover:border-rose-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70 sm:text-base ${
                    content.enableGlow
                      ? 'bg-white/12 shadow-[0_0_34px_rgba(251,113,133,0.32)] hover:shadow-[0_0_44px_rgba(251,113,133,0.44)]'
                      : 'bg-white/8'
                  }`}
                >
                  {content.buttonText}
                </motion.button>
              </div>

              <motion.div
                className="relative mx-auto w-full max-w-xl [perspective:1500px]"
                initial={false}
                animate="closed"
              >
                <motion.div
                  aria-hidden
                  className="absolute inset-x-8 top-10 h-48 rounded-full bg-rose-300/20 blur-3xl"
                  animate={reduceMotion ? undefined : { opacity: [0.35, 0.7, 0.35], scale: [0.95, 1.05, 0.95] }}
                  transition={reduceMotion ? undefined : { duration: 5.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                />
                <div className="relative aspect-[1.25/1] w-full">
                  <motion.div
                    className="absolute inset-x-[7%] bottom-[8%] h-[68%] rounded-b-[2rem] border border-rose-100/40 bg-gradient-to-br from-rose-200 via-pink-100 to-orange-100 shadow-[0_34px_80px_-44px_rgba(244,63,94,0.95)]"
                    initial={{ y: reduceMotion ? 0 : 10, rotateZ: reduceMotion ? 0 : -1 }}
                    animate={{ y: 0, rotateZ: 0 }}
                    transition={{ duration: reduceMotion ? 0.01 : 0.7, ease: sectionEase }}
                  />
                  <div
                    className="absolute inset-x-[7%] bottom-[8%] h-[68%] rounded-b-[2rem] bg-gradient-to-tr from-rose-400/55 via-rose-100/30 to-transparent"
                    style={{ clipPath: 'polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%)' }}
                  />
                  <motion.div
                    className="absolute inset-x-[7%] bottom-[45%] h-[37%] origin-bottom rounded-t-[1.8rem] border border-rose-50/55 bg-gradient-to-br from-rose-50 via-pink-100 to-rose-200 shadow-[0_22px_50px_-38px_rgba(255,255,255,0.95)]"
                    style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
                    animate={reduceMotion ? undefined : { rotateX: [0, -4, 0] }}
                    transition={reduceMotion ? undefined : { duration: 4.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                  />
                  <div
                    className="absolute inset-x-[7%] bottom-[8%] h-[68%] rounded-b-[2rem] border border-rose-50/55 bg-gradient-to-tr from-rose-300 via-pink-100 to-orange-100"
                    style={{ clipPath: 'polygon(0 0, 50% 60%, 100% 0, 100% 100%, 0 100%)' }}
                  />
                  <div className="absolute bottom-[18%] left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border border-rose-100/65 bg-gradient-to-br from-rose-500 to-pink-500 text-xl shadow-[0_14px_28px_-16px_rgba(244,63,94,0.95)]">
                    <span aria-hidden>&hearts;</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="love-letter-open"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.45, ease: sectionEase }}
              className="grid w-full gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-10"
            >
              <motion.div
                className="mx-auto w-full max-w-md lg:max-w-lg"
                initial="closed"
                animate="open"
                aria-hidden
              >
                <div className="relative aspect-[1.25/1] w-full [perspective:1500px]">
                  <motion.div
                    className="absolute inset-x-[7%] bottom-[9%] h-[68%] rounded-b-[2rem] border border-rose-100/35 bg-gradient-to-br from-rose-200 via-pink-100 to-orange-100 shadow-[0_30px_75px_-45px_rgba(244,63,94,0.9)]"
                    variants={{
                      closed: { y: 0, scale: 1 },
                      open: { y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : 0.96 },
                    }}
                    transition={{ duration, ease: sectionEase }}
                  />
                  <motion.div
                    className="absolute inset-x-[11%] bottom-[19%] h-[60%] rounded-t-[1.5rem] border border-rose-100/70 bg-[#fff8ef]"
                    variants={{
                      closed: { opacity: 0, y: reduceMotion ? 0 : 90, scale: reduceMotion ? 1 : 0.9 },
                      open: { opacity: 1, y: reduceMotion ? 0 : -54, scale: 1 },
                    }}
                    transition={{ duration: reduceMotion ? 0.01 : 0.9, delay: reduceMotion ? 0 : 0.18, ease: sectionEase }}
                  >
                    <div className="mx-auto mt-6 h-2 w-28 rounded-full bg-rose-200/85" />
                    <div className="mx-auto mt-4 h-2 w-44 rounded-full bg-pink-100" />
                    <div className="mx-auto mt-4 h-2 w-36 rounded-full bg-orange-100" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-x-[7%] bottom-[45%] h-[37%] origin-bottom rounded-t-[1.8rem] border border-rose-50/55 bg-gradient-to-br from-rose-50 via-pink-100 to-rose-200"
                    style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
                    variants={{
                      closed: { rotateX: 0, y: 0, zIndex: 8 },
                      open: { rotateX: reduceMotion ? 0 : -165, y: reduceMotion ? 0 : -6, zIndex: 2 },
                    }}
                    transition={{ duration, ease: sectionEase }}
                  />
                  <motion.div
                    className="absolute inset-x-[7%] bottom-[9%] h-[68%] rounded-b-[2rem] border border-rose-50/55 bg-gradient-to-tr from-rose-300 via-pink-100 to-orange-100"
                    style={{ clipPath: 'polygon(0 0, 50% 60%, 100% 0, 100% 100%, 0 100%)' }}
                    variants={{
                      closed: { y: 0, scale: 1 },
                      open: { y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : 0.96 },
                    }}
                    transition={{ duration, ease: sectionEase }}
                  />
                  <motion.div
                    className="absolute bottom-[19%] left-1/2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full border border-rose-100/65 bg-gradient-to-br from-rose-500 to-pink-500 text-lg shadow-[0_14px_28px_-16px_rgba(244,63,94,0.95)]"
                    variants={{
                      closed: { opacity: 1 },
                      open: { opacity: reduceMotion ? 1 : 0.72 },
                    }}
                    transition={{ duration, ease: sectionEase }}
                  >
                    <span aria-hidden>&hearts;</span>
                  </motion.div>
                </div>
              </motion.div>

              <motion.article
                id={`love-letter-${section.id}`}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 26, scale: reduceMotion ? 1 : 0.975 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: reduceMotion ? 0.01 : 0.78, delay: reduceMotion ? 0 : 0.42, ease: sectionEase }}
                className={`relative mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border px-5 py-8 sm:px-9 sm:py-11 lg:px-12 lg:py-14 ${selectedPaperStyle.article}`}
              >
                <div className={`pointer-events-none absolute inset-0 ${selectedPaperStyle.surface}`} />
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/80" />
                <div className="relative z-10">
                  <div
                    className={`flex flex-col items-start justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center ${selectedPaperStyle.rule}`}
                  >
                    <div>
                      {displayLabel ? (
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.32em] ${selectedPaperStyle.muted}`}>
                          {displayLabel}
                        </p>
                      ) : null}
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{content.title}</h3>
                    </div>

                    {canUseMusic ? (
                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <button
                          type="button"
                          onClick={() => {
                            void handleMusicToggle()
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70 ${selectedPaperStyle.rule} ${selectedPaperStyle.muted}`}
                        >
                          {isMusicPlaying ? 'Pause song' : 'Play song'}
                        </button>
                        {musicError ? <p className={`max-w-36 text-right text-[11px] ${selectedPaperStyle.muted}`}>{musicError}</p> : null}
                      </div>
                    ) : null}
                  </div>

                  <div className={`mt-7 space-y-6 text-[1.03rem] leading-8 sm:text-lg sm:leading-9 ${selectedPaperStyle.ink}`}>
                    {paragraphs.map((paragraph, index) => (
                      <motion.p
                        key={`${paragraph}-${index}`}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: reduceMotion ? 0.01 : 0.5,
                          delay: reduceMotion ? 0 : 0.68 + index * 0.14,
                          ease: sectionEase,
                        }}
                      >
                        {paragraph}
                      </motion.p>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0.01 : 0.52,
                      delay: reduceMotion ? 0 : 0.78 + paragraphs.length * 0.14,
                      ease: sectionEase,
                    }}
                    className={`mt-10 border-t pt-7 text-right ${selectedPaperStyle.rule}`}
                  >
                    <p className={`text-sm uppercase tracking-[0.24em] ${selectedPaperStyle.muted}`}>Always</p>
                    <p className={`mt-2 text-2xl font-semibold italic leading-tight sm:text-3xl ${selectedPaperStyle.signature}`}>
                      {content.signature}
                    </p>
                  </motion.div>
                </div>
              </motion.article>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {canUseMusic ? (
        <audio
          ref={audioRef}
          src={section.music_url ?? undefined}
          preload="metadata"
          onPlay={() => {
            setIsMusicPlaying(true)
          }}
          onPause={() => {
            setIsMusicPlaying(false)
          }}
        />
      ) : null}
    </motion.section>
  )
}
