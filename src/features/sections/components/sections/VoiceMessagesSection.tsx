import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { getSectionDisplayLabel } from '@/features/sections/utils/sectionDisplayLabel'
import type { JsonValue, RomanticSection } from '@/types/section'

interface VoiceMessagesSectionProps {
  section: RomanticSection
}

interface VoiceMessage {
  id: string
  title: string
  description: string
  audioUrl: string
}

interface VoiceMessagesContent {
  title: string
  subtitle: string
  messages: VoiceMessage[]
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

const defaultMessages: VoiceMessage[] = [
  {
    id: 'miss-me',
    title: 'Listen when you miss me',
    description: 'Play this whenever you need to hear me.',
    audioUrl: '',
  },
  {
    id: 'before-sleeping',
    title: 'Before sleeping',
    description: 'A small good night from Ahmed.',
    audioUrl: '',
  },
  {
    id: 'feel-sad',
    title: 'When you feel sad',
    description: 'My voice is here to sit beside your heart.',
    audioUrl: '',
  },
]

const defaultContent: VoiceMessagesContent = {
  title: 'Voice Messages For Asmaa',
  subtitle: 'Little pieces of my voice, saved for you.',
  messages: defaultMessages,
  showParticles: true,
  enableGlow: true,
}

const isRecord = (value: JsonValue): value is Record<string, JsonValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getString = (value: JsonValue | undefined, fallback: string): string => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

const getOptionalString = (value: JsonValue | undefined): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const getBoolean = (value: JsonValue | undefined, fallback: boolean): boolean => {
  return typeof value === 'boolean' ? value : fallback
}

const buildParticles = (): ParticleState[] => {
  return Array.from({ length: 16 }, (_, index) => ({
    id: index,
    left: `${(index * 41 + 13) % 100}%`,
    top: `${(index * 59 + 19) % 100}%`,
    size: 4 + ((index * 5) % 9),
    duration: 8 + (index % 5),
    delay: (index % 6) * 0.28,
    opacity: 0.14 + (index % 4) * 0.07,
  }))
}

const normalizeMessage = (rawMessage: JsonValue, index: number): VoiceMessage | null => {
  if (!isRecord(rawMessage)) {
    return null
  }

  const title = getString(rawMessage.title, defaultMessages[index % defaultMessages.length]?.title ?? `Voice message ${index + 1}`)
  const description = getOptionalString(rawMessage.description)
  const audioUrl = getOptionalString(rawMessage.audioUrl)

  if (title.length === 0 && description.length === 0 && audioUrl.length === 0) {
    return null
  }

  return {
    id: getOptionalString(rawMessage.id) || `voice-message-${index + 1}`,
    title,
    description,
    audioUrl,
  }
}

const resolveVoiceMessagesContent = (section: RomanticSection): VoiceMessagesContent => {
  if (!isRecord(section.content)) {
    return {
      ...defaultContent,
      title: section.title || defaultContent.title,
      messages: section.voice_note_url ? [{ ...defaultMessages[0], audioUrl: section.voice_note_url }] : defaultContent.messages,
    }
  }

  const rawMessages = Array.isArray(section.content.messages) ? section.content.messages : []
  const messages = rawMessages
    .map((rawMessage, index) => normalizeMessage(rawMessage, index))
    .filter((message): message is VoiceMessage => message !== null)

  return {
    title: getString(section.content.title, section.title || defaultContent.title),
    subtitle: getString(section.content.subtitle, defaultContent.subtitle),
    messages: messages.length > 0 ? messages : defaultContent.messages,
    showParticles: getBoolean(section.content.showParticles, defaultContent.showParticles),
    enableGlow: getBoolean(section.content.enableGlow, defaultContent.enableGlow),
  }
}

const formatPlaybackTime = (seconds: number | undefined): string => {
  if (!seconds || !Number.isFinite(seconds)) {
    return '0:00'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const ParticleLayer = memo(({ particles, reduceMotion }: ParticleLayerProps) => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-rose-100/75 will-change-transform"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            filter: 'blur(0.55px)',
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [-7, 10, -7],
                  x: [-2, 3, -2],
                  scale: [1, 1.18, 1],
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

ParticleLayer.displayName = 'VoiceMessagesParticleLayer'

export const VoiceMessagesSection = ({ section }: VoiceMessagesSectionProps) => {
  const reduceMotion = useReducedMotion()
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const [progressByMessageId, setProgressByMessageId] = useState<Record<string, number>>({})
  const [timeByMessageId, setTimeByMessageId] = useState<Record<string, { currentTime: number; duration: number }>>({})
  const [playbackErrorId, setPlaybackErrorId] = useState<string | null>(null)
  const content = useMemo(() => resolveVoiceMessagesContent(section), [section])
  const displayLabel = useMemo(() => getSectionDisplayLabel(section), [section])
  const particles = useMemo(() => (content.showParticles ? buildParticles() : []), [content.showParticles])

  const pauseOtherMessages = useCallback((messageId: string) => {
    Object.entries(audioRefs.current).forEach(([existingMessageId, audio]) => {
      if (existingMessageId !== messageId && audio && !audio.paused) {
        audio.pause()
      }
    })
  }, [])

  const handleTogglePlayback = useCallback(
    async (message: VoiceMessage) => {
      const audio = audioRefs.current[message.id]

      if (!audio || message.audioUrl.length === 0) {
        return
      }

      if (!audio.paused) {
        audio.pause()
        return
      }

      pauseOtherMessages(message.id)

      try {
        await audio.play()
        setPlaybackErrorId(null)
        setActiveMessageId(message.id)
      } catch {
        setPlaybackErrorId(message.id)
        setActiveMessageId(null)
      }
    },
    [pauseOtherMessages],
  )

  const handleTimeUpdate = useCallback((messageId: string, audio: HTMLAudioElement) => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0
    const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0
    const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0

    setProgressByMessageId((previousProgress) => ({
      ...previousProgress,
      [messageId]: progress,
    }))
    setTimeByMessageId((previousTimes) => ({
      ...previousTimes,
      [messageId]: {
        currentTime,
        duration,
      },
    }))
  }, [])

  return (
    <motion.section
      initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.68, ease: sectionEase }}
      className={`relative -mx-4 overflow-hidden bg-[radial-gradient(circle_at_20%_12%,rgba(251,113,133,0.34),transparent_35%),linear-gradient(135deg,#2a071d_0%,#5c123c_46%,#111827_100%)] px-4 py-10 text-white shadow-[0_32px_90px_-58px_rgba(244,63,94,0.95)] sm:mx-0 sm:rounded-[2.25rem] sm:px-8 sm:py-12 lg:px-10 ${
        content.enableGlow ? 'shadow-rose-500/30' : ''
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_16%,rgba(244,114,182,0.24),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,rgba(255,255,255,0.09),transparent_42%,rgba(255,255,255,0.05))]" />
      {content.showParticles ? <ParticleLayer particles={particles} reduceMotion={reduceMotion} /> : null}

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          {displayLabel ? (
            <motion.p
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.18 : 0.5, ease: sectionEase }}
              className="text-[11px] font-semibold uppercase tracking-[0.34em] text-rose-100/75 sm:text-xs"
            >
              {displayLabel}
            </motion.p>
          ) : null}
          <motion.h2
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.65, delay: reduceMotion ? 0 : 0.08, ease: sectionEase }}
            className={`${displayLabel ? 'mt-4' : ''} text-3xl font-semibold leading-tight tracking-tight text-rose-50 sm:text-5xl ${
              content.enableGlow ? '[text-shadow:0_0_34px_rgba(251,113,133,0.42)]' : ''
            }`}
          >
            {content.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.62, delay: reduceMotion ? 0 : 0.14, ease: sectionEase }}
            className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-rose-50/78 sm:text-lg sm:leading-8"
          >
            {content.subtitle}
          </motion.p>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 lg:grid-cols-3">
          {content.messages.map((message, index) => {
            const isActive = activeMessageId === message.id
            const hasAudio = message.audioUrl.length > 0
            const progress = progressByMessageId[message.id] ?? 0
            const playbackTime = timeByMessageId[message.id] ?? { currentTime: 0, duration: 0 }

            return (
              <motion.article
                key={message.id}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0.18 : 0.55,
                  delay: reduceMotion ? 0 : 0.18 + index * 0.07,
                  ease: sectionEase,
                }}
                className={`flex min-h-64 w-full flex-col rounded-[1.75rem] border border-white/14 bg-white/10 p-5 text-left backdrop-blur-md sm:p-6 ${
                  isActive ? 'shadow-[0_24px_70px_-44px_rgba(251,113,133,0.95)] ring-1 ring-rose-100/40' : ''
                } ${content.enableGlow ? 'shadow-[0_18px_52px_-42px_rgba(251,113,133,0.85)]' : ''}`}
              >
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-100/60">
                        Voice {index + 1}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white">{message.title}</h3>
                    </div>
                    <span
                      aria-hidden
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-rose-100/25 bg-rose-50/12 text-lg shadow-inner shadow-white/10"
                    >
                      {isActive ? '||' : '>'}
                    </span>
                  </div>

                  {message.description ? (
                    <p className="mt-4 text-sm leading-6 text-rose-50/70">{message.description}</p>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-rose-50/52">A little message from Ahmed, saved for Asmaa.</p>
                  )}
                </div>

                <div className="mt-7 space-y-3">
                  <div className="h-2 overflow-hidden rounded-full bg-white/12">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-rose-200 via-pink-300 to-rose-400"
                      initial={false}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: reduceMotion ? 0.01 : 0.18, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-rose-100/58">
                    <span>{formatPlaybackTime(playbackTime.currentTime)}</span>
                    <span>{formatPlaybackTime(playbackTime.duration)}</span>
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => {
                      void handleTogglePlayback(message)
                    }}
                    whileTap={{ scale: reduceMotion ? 1 : 0.97 }}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-rose-100/35 bg-white/12 px-5 py-3 text-sm font-semibold text-rose-50 transition hover:border-rose-100/65 hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/75 disabled:cursor-not-allowed disabled:opacity-55"
                    disabled={!hasAudio}
                    aria-label={`${isActive ? 'Pause' : 'Play'} ${message.title}`}
                  >
                    {!hasAudio ? 'Voice note coming soon' : isActive ? 'Pause voice message' : 'Play voice message'}
                  </motion.button>

                  {playbackErrorId === message.id ? (
                    <p className="text-xs leading-5 text-rose-100/75">Tap again if your browser needs a direct sound gesture.</p>
                  ) : null}
                </div>

                {hasAudio ? (
                  <audio
                    ref={(audio) => {
                      audioRefs.current[message.id] = audio
                    }}
                    src={message.audioUrl}
                    preload="metadata"
                    onPlay={() => {
                      pauseOtherMessages(message.id)
                      setActiveMessageId(message.id)
                    }}
                    onPause={() => {
                      setActiveMessageId((currentMessageId) => (currentMessageId === message.id ? null : currentMessageId))
                    }}
                    onEnded={() => {
                      setActiveMessageId((currentMessageId) => (currentMessageId === message.id ? null : currentMessageId))
                      setProgressByMessageId((previousProgress) => ({
                        ...previousProgress,
                        [message.id]: 0,
                      }))
                    }}
                    onLoadedMetadata={(event) => {
                      handleTimeUpdate(message.id, event.currentTarget)
                    }}
                    onTimeUpdate={(event) => {
                      handleTimeUpdate(message.id, event.currentTarget)
                    }}
                  >
                    Your browser does not support audio playback.
                  </audio>
                ) : null}
              </motion.article>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}
