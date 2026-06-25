import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { RomanticSection } from '@/types/section'
import {
  cinematicButtonVariants,
  cinematicContainerVariants,
  cinematicEasing,
  cinematicFadeUpVariants,
  cinematicSubtitleVariants,
} from '@/features/sections/components/sections/cinematic/animationPresets'
import { resolveCinematicIntroContent } from '@/features/sections/components/sections/cinematic/content'
import { getSectionDisplayLabel } from '@/features/sections/utils/sectionDisplayLabel'

interface CinematicIntroSectionProps {
  section: RomanticSection
  sections?: RomanticSection[]
}

interface ParticleState {
  id: number
  left: string
  top: string
  duration: number
  delay: number
  blur: number
}

const PARTICLE_COUNT = 14

interface CinematicParticleLayerProps {
  particles: ParticleState[]
  reduceMotion: boolean | null
}

const buildParticles = (): ParticleState[] => {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    id: index,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 10 + Math.random() * 8,
    delay: Math.random() * 2,
    blur: 1 + Math.random() * 3,
  }))
}

const CinematicParticleLayer = memo(({ particles, reduceMotion }: CinematicParticleLayerProps) => {
  return (
    <div aria-hidden className="absolute inset-0">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute h-1.5 w-1.5 rounded-full bg-rose-100/70 will-change-transform"
          style={{ left: particle.left, top: particle.top, filter: `blur(${particle.blur}px)` }}
          animate={reduceMotion ? undefined : { y: [-6, 6, -6], opacity: [0.2, 0.55, 0.2], scale: [1, 1.3, 1] }}
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

CinematicParticleLayer.displayName = 'CinematicParticleLayer'

export const CinematicIntroSection = ({ section, sections }: CinematicIntroSectionProps) => {
  const rootRef = useRef<HTMLElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasAttemptedAutoplayRef = useRef(false)
  const reduceMotion = useReducedMotion()
  const [typedText, setTypedText] = useState('')
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isIntroAudioPlaying, setIsIntroAudioPlaying] = useState(false)
  const [introAudioError, setIntroAudioError] = useState<string | null>(null)
  const [showAutoplayPrompt, setShowAutoplayPrompt] = useState(false)
  const [introAudioVolume, setIntroAudioVolume] = useState(0.72)
  const content = useMemo(() => resolveCinematicIntroContent(section), [section])
  const displayLabel = useMemo(() => getSectionDisplayLabel(section), [section])
  const particles = useMemo(() => buildParticles(), [])
  const canRenderBackgroundImage = content.backgroundMode === 'image' && Boolean(section.image_url)
  const introAudioUrl = content.audioUrl || section.music_url || ''
  const canUseIntroAudio = introAudioUrl.length > 0 && content.enableMusic
  const isFirstPublicSection = !sections || sections[0]?.id === section.id
  const shouldAttemptIntroAudioAutoplay = canUseIntroAudio && isFirstPublicSection && content.autoPlayMusic

  useEffect(() => {
    let setupTimer: number | null = null
    let typingInterval: number | null = null
    let subtitleTimeout: number | null = null

    if (reduceMotion) {
      setupTimer = window.setTimeout(() => {
        setTypedText(content.title)
        setShowSubtitle(true)
      }, 0)
      return () => {
        if (setupTimer !== null) {
          window.clearTimeout(setupTimer)
        }
      }
    }

    setupTimer = window.setTimeout(() => {
      setTypedText('')
      setShowSubtitle(false)

      let currentIndex = 0
      typingInterval = window.setInterval(() => {
        currentIndex += 1
        setTypedText(content.title.slice(0, currentIndex))

        if (currentIndex >= content.title.length) {
          if (typingInterval !== null) {
            window.clearInterval(typingInterval)
          }

          subtitleTimeout = window.setTimeout(() => {
            setShowSubtitle(true)
          }, 350)
        }
      }, content.typingSpeed)
    }, 0)

    return () => {
      if (setupTimer !== null) {
        window.clearTimeout(setupTimer)
      }
      if (typingInterval !== null) {
        window.clearInterval(typingInterval)
      }
      if (subtitleTimeout !== null) {
        window.clearTimeout(subtitleTimeout)
      }
    }
  }, [content.title, content.typingSpeed, reduceMotion])

  const pauseOtherAudioElements = useCallback(() => {
    const introAudio = audioRef.current

    if (typeof document === 'undefined' || !introAudio) {
      return
    }

    document.querySelectorAll('audio').forEach((audio) => {
      if (audio !== introAudio && !audio.paused) {
        audio.pause()
      }
    })
  }, [])

  const tryPlayIntroAudio = useCallback(
    async (source: 'autoplay' | 'manual') => {
      if (!canUseIntroAudio || !audioRef.current) {
        return
      }

      pauseOtherAudioElements()
      audioRef.current.volume = introAudioVolume

      try {
        await audioRef.current.play()
        setIntroAudioError(null)
        setShowAutoplayPrompt(false)
        setIsIntroAudioPlaying(true)
      } catch {
        if (source === 'autoplay') {
          setShowAutoplayPrompt(true)
          setIntroAudioError(null)
        } else {
          setIntroAudioError('Tap again if your browser needs a direct sound gesture.')
        }
        setIsIntroAudioPlaying(false)
      }
    },
    [canUseIntroAudio, introAudioVolume, pauseOtherAudioElements],
  )

  useEffect(() => {
    hasAttemptedAutoplayRef.current = false
    setShowAutoplayPrompt(false)
    setIntroAudioError(null)
    setIsIntroAudioPlaying(false)
  }, [introAudioUrl, section.id])

  useEffect(() => {
    if (!audioRef.current) {
      return
    }

    audioRef.current.volume = introAudioVolume
  }, [introAudioUrl, introAudioVolume])

  useEffect(() => {
    const handleDocumentAudioPlay = (event: Event) => {
      const introAudio = audioRef.current
      const target = event.target

      if (!introAudio || !(target instanceof HTMLAudioElement) || target === introAudio) {
        return
      }

      if (!introAudio.paused) {
        introAudio.pause()
      }
    }

    document.addEventListener('play', handleDocumentAudioPlay, true)

    return () => {
      document.removeEventListener('play', handleDocumentAudioPlay, true)
    }
  }, [])

  useEffect(() => {
    if (!shouldAttemptIntroAudioAutoplay || hasAttemptedAutoplayRef.current) {
      return
    }

    hasAttemptedAutoplayRef.current = true

    const autoplayTimeout = window.setTimeout(() => {
      void tryPlayIntroAudio('autoplay')
    }, 150)

    return () => {
      window.clearTimeout(autoplayTimeout)
    }
  }, [shouldAttemptIntroAudioAutoplay, tryPlayIntroAudio])

  useEffect(() => {
    const introAudio = audioRef.current

    return () => {
      introAudio?.pause()
    }
  }, [])

  const handleEnter = () => {
    if (isTransitioning || isCompleted) {
      return
    }

    setIsTransitioning(true)

    const transitionDurationMs = reduceMotion ? 100 : 900
    window.setTimeout(() => {
      audioRef.current?.pause()
      const nextElement = rootRef.current?.nextElementSibling
      if (nextElement instanceof HTMLElement) {
        nextElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
      }
      setIsCompleted(true)
    }, transitionDurationMs)
  }

  const handleIntroAudioToggle = async () => {
    if (!audioRef.current) {
      return
    }

    try {
      if (audioRef.current.paused) {
        await tryPlayIntroAudio('manual')
        return
      }

      audioRef.current.pause()
      setIsIntroAudioPlaying(false)
    } catch {
      setIntroAudioError('Tap again if your browser needs a direct sound gesture.')
    }
  }

  const handleIntroAudioStop = () => {
    if (!audioRef.current) {
      return
    }

    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsIntroAudioPlaying(false)
  }

  if (isCompleted) {
    return <div aria-hidden className="h-px w-full" />
  }

  return (
    <motion.section
      ref={rootRef}
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex min-h-[100svh] w-screen items-center justify-center overflow-hidden"
      animate={
        isTransitioning
          ? { opacity: 0, scale: 1.03 }
          : { opacity: 1, scale: 1 }
      }
      transition={{ duration: reduceMotion ? 0.15 : 0.9, ease: cinematicEasing }}
    >
      {canRenderBackgroundImage ? (
        <motion.img
          src={section.image_url ?? ''}
          alt={section.title}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0.2 : 1.8, ease: cinematicEasing }}
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#7f1d1d_0%,_#2f132a_40%,_#09090b_80%)]" />
      )}

      <div
        className="absolute inset-0 bg-[linear-gradient(160deg,rgba(12,10,9,0.35),rgba(9,9,11,0.8)_65%)]"
        style={{ opacity: content.overlayOpacity }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,113,133,0.22),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_80%,rgba(244,114,182,0.16),transparent_45%)]" />

      {content.showParticles ? <CinematicParticleLayer particles={particles} reduceMotion={reduceMotion} /> : null}

      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 text-center sm:px-10"
        variants={cinematicContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {displayLabel ? (
          <motion.p
            variants={cinematicFadeUpVariants}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-rose-100/75"
          >
            {displayLabel}
          </motion.p>
        ) : null}

        <motion.h1
          variants={cinematicFadeUpVariants}
          className={`max-w-4xl text-3xl font-semibold leading-tight text-white drop-shadow-[0_0_30px_rgba(253,164,175,0.35)] sm:text-5xl md:text-6xl ${
            content.enableGlow ? '[text-shadow:0_0_24px_rgba(251,113,133,0.35)]' : ''
          }`}
        >
          {typedText}
          <motion.span
            aria-hidden
            className="ml-1 inline-block h-[1.15em] w-[2px] bg-rose-100/80 align-middle"
            animate={reduceMotion ? undefined : { opacity: [1, 0, 1] }}
            transition={reduceMotion ? undefined : { duration: 0.85, repeat: Number.POSITIVE_INFINITY }}
          />
        </motion.h1>

        <AnimatePresence>
          {showSubtitle ? (
            <motion.p
              key="cinematic-subtitle"
              variants={cinematicSubtitleVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="mt-6 max-w-2xl text-base font-medium text-rose-100/90 sm:text-xl"
            >
              {content.subtitle}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          variants={cinematicButtonVariants}
          className={`mt-12 inline-flex items-center justify-center rounded-full border border-rose-100/45 px-8 py-3 text-sm font-medium tracking-wide text-rose-50 backdrop-blur-md transition duration-300 hover:scale-[1.01] hover:border-rose-100/70 sm:text-base ${
            content.enableGlow
              ? 'bg-white/8 shadow-[0_0_30px_rgba(251,113,133,0.35)] hover:shadow-[0_0_36px_rgba(251,113,133,0.45)]'
              : 'bg-white/5'
          }`}
          whileTap={{ scale: reduceMotion ? 1 : 0.98 }}
          onClick={handleEnter}
        >
          {content.buttonText}
        </motion.button>
      </motion.div>

      {canUseIntroAudio ? (
        <>
          <audio
            ref={audioRef}
            src={introAudioUrl}
            loop
            preload="metadata"
            onLoadedMetadata={(event) => {
              event.currentTarget.volume = introAudioVolume
            }}
            onPlay={() => {
              setIsIntroAudioPlaying(true)
              setShowAutoplayPrompt(false)
            }}
            onPause={() => {
              setIsIntroAudioPlaying(false)
            }}
          />
          <div className="pointer-events-none absolute inset-x-3 bottom-4 z-20 flex justify-center sm:inset-x-auto sm:right-8 sm:justify-end">
            <div className="pointer-events-auto w-full max-w-sm rounded-[1.4rem] border border-rose-100/28 bg-black/28 p-3 text-rose-50 shadow-[0_20px_60px_-38px_rgba(251,113,133,0.9)] backdrop-blur-md sm:w-80">
              {showAutoplayPrompt ? (
                <button
                  type="button"
                  onClick={() => {
                    void tryPlayIntroAudio('manual')
                  }}
                  className="mb-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-rose-100/45 bg-rose-50/14 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:border-rose-100/70 hover:bg-rose-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-100/70"
                >
                  شغّلي الصوت ❤️
                </button>
              ) : null}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleIntroAudioToggle()
                  }}
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-rose-100/35 bg-white/10 px-3 py-2 text-xs font-semibold text-rose-50 transition hover:border-rose-100/65 hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-100/70"
                >
                  {isIntroAudioPlaying ? 'Pause audio' : 'Play audio'}
                </button>
                <button
                  type="button"
                  onClick={handleIntroAudioStop}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-100/25 bg-white/8 px-3 py-2 text-xs font-semibold text-rose-100/82 transition hover:border-rose-100/55 hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-100/70"
                >
                  Stop
                </button>
              </div>

              <label className="mt-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-rose-100/70">
                <span>Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={introAudioVolume}
                  onChange={(event) => {
                    setIntroAudioVolume(event.currentTarget.valueAsNumber)
                  }}
                  className="h-8 min-w-0 flex-1 accent-rose-200"
                  aria-label="Intro audio volume"
                />
              </label>

              {introAudioError ? (
                <p className="mt-2 rounded-md border border-amber-300/35 bg-amber-950/45 px-2 py-1 text-[11px] leading-5 text-amber-100">
                  {introAudioError}
                </p>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </motion.section>
  )
}
