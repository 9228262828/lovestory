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

export const CinematicIntroSection = ({ section }: CinematicIntroSectionProps) => {
  const rootRef = useRef<HTMLElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const reduceMotion = useReducedMotion()
  const [typedText, setTypedText] = useState('')
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [musicError, setMusicError] = useState<string | null>(null)
  const content = useMemo(() => resolveCinematicIntroContent(section), [section])
  const displayLabel = useMemo(() => getSectionDisplayLabel(section), [section])
  const particles = useMemo(() => buildParticles(), [])
  const canRenderBackgroundImage = content.backgroundMode === 'image' && Boolean(section.image_url)
  const canUseMusic = Boolean(section.music_url) && content.enableMusic

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

  const tryPlayMusic = useCallback(async () => {
    if (!canUseMusic || !audioRef.current) {
      return
    }

    try {
      await audioRef.current.play()
      setMusicError(null)
      setIsMusicPlaying(true)
    } catch {
      setMusicError('Tap the sound button to enable music on this browser.')
      setIsMusicPlaying(false)
    }
  }, [canUseMusic])

  useEffect(() => {
    if (!content.autoPlayMusic || reduceMotion) {
      return
    }

    void audioRef.current?.play().catch(() => undefined)
  }, [content.autoPlayMusic, reduceMotion])

  const handleEnter = () => {
    if (isTransitioning || isCompleted) {
      return
    }

    setIsTransitioning(true)

    if (canUseMusic) {
      void tryPlayMusic()
    }

    const transitionDurationMs = reduceMotion ? 100 : 900
    window.setTimeout(() => {
      const nextElement = rootRef.current?.nextElementSibling
      if (nextElement instanceof HTMLElement) {
        nextElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
      }
      setIsCompleted(true)
    }, transitionDurationMs)
  }

  const handleMusicToggle = async () => {
    if (!audioRef.current) {
      return
    }

    if (audioRef.current.paused) {
      await tryPlayMusic()
      return
    }

    audioRef.current.pause()
    setIsMusicPlaying(false)
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
          whileTap={{ scale: 0.98 }}
          onClick={handleEnter}
        >
          {content.buttonText}
        </motion.button>
      </motion.div>

      {canUseMusic ? (
        <>
          <audio
            ref={audioRef}
            src={section.music_url ?? undefined}
            loop
            preload="metadata"
            onPlay={() => {
              setIsMusicPlaying(true)
            }}
            onPause={() => {
              setIsMusicPlaying(false)
            }}
          />
          <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 sm:bottom-6 sm:right-8">
            <button
              type="button"
              onClick={() => {
                void handleMusicToggle()
              }}
              className="pointer-events-auto rounded-full border border-rose-100/35 bg-black/25 px-3 py-1.5 text-xs font-medium text-rose-100 backdrop-blur-md transition hover:border-rose-100/60"
            >
              {isMusicPlaying ? 'Mute Music' : 'Play Music'}
            </button>
            {musicError ? (
              <p className="max-w-56 rounded-md border border-amber-300/35 bg-amber-950/45 px-2 py-1 text-[11px] text-amber-100">
                {musicError}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </motion.section>
  )
}
