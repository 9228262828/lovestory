import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion, useReducedMotion } from 'framer-motion'
import { defaultEmotionalEmergencyKitDoses } from '@/features/sections/components/sections/emotionalEmergencyKit/content'
import { getSectionDisplayLabel } from '@/features/sections/utils/sectionDisplayLabel'
import { useTotalKissCount } from '@/hooks/useTotalKissCount'
import type { JsonValue, RomanticSection } from '@/types/section'

interface OurStoryInNumbersSectionProps {
  section: RomanticSection
  sections?: RomanticSection[]
}

interface OurStoryInNumbersContent {
  title: string
  subtitle: string
}

interface StoryCounts {
  galleryImages: number
  voiceMessages: number
  reasons: number
  kisses: number
  loveLetters: number
  emotionalDoses: number
}

interface StoryStat {
  id: string
  icon: string
  label: string
  value: number | null
  caption: string
  accentClassName: string
}

interface FloatingParticle {
  id: number
  label: string
  left: string
  top: string
  delay: number
  duration: number
  travel: number
  sizeClassName: string
}

interface AnimatedNumberProps {
  value: number | null
  delay?: number
  reduceMotion: boolean | null
  className?: string
}

interface StatCardProps {
  stat: StoryStat
  index: number
  reduceMotion: boolean | null
}

interface FloatingParticlesProps {
  particles: FloatingParticle[]
  reduceMotion: boolean | null
}

const sectionEase: [number, number, number, number] = [0.22, 1, 0.36, 1]
const relationshipStartDateLabel = '04/04/2024'
const relationshipStartTimestamp = Date.UTC(2024, 3, 4)
const millisecondsPerDay = 86_400_000
const defaultTitle = '❤️ حكايتنا بالأرقام'
const defaultSubtitle = 'كل رقم هنا وراه ذكرى... وكل ذكرى وراها لحظة معاكِ ❤️'

const isRecord = (value: JsonValue | undefined): value is Record<string, JsonValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getOptionalString = (value: JsonValue | undefined): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const getString = (value: JsonValue | undefined, fallback: string): string => {
  const normalizedValue = getOptionalString(value)
  return normalizedValue.length > 0 ? normalizedValue : fallback
}

const resolveOurStoryInNumbersContent = (section: RomanticSection): OurStoryInNumbersContent => {
  if (!isRecord(section.content)) {
    return {
      title: defaultTitle,
      subtitle: defaultSubtitle,
    }
  }

  return {
    title: getString(section.content.title, defaultTitle),
    subtitle: getString(section.content.subtitle, defaultSubtitle),
  }
}

const getDaysTogether = (currentDate: Date = new Date()): number => {
  const currentDayTimestamp = Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate(),
  )

  return Math.max(0, Math.floor((currentDayTimestamp - relationshipStartTimestamp) / millisecondsPerDay))
}

const hasText = (value: JsonValue | undefined): boolean => {
  return getOptionalString(value).length > 0
}

const countGalleryImages = (section: RomanticSection): number => {
  if (section.type !== '3d-gallery' && section.type !== 'gallery') {
    return 0
  }

  if (!isRecord(section.content)) {
    return section.image_url ? 1 : 0
  }

  const rawCards = Array.isArray(section.content.cards) ? section.content.cards : []
  if (rawCards.length > 0) {
    return rawCards.filter((rawCard) => {
      if (!isRecord(rawCard)) {
        return false
      }

      const hasImageUrl = hasText(rawCard.imageUrl) || hasText(rawCard.url) || hasText(rawCard.src)
      const isImageCard = rawCard.type === 'image' || hasImageUrl

      return isImageCard && (hasImageUrl || Boolean(section.image_url))
    }).length
  }

  const rawImages = Array.isArray(section.content.images) ? section.content.images : []
  if (rawImages.length > 0) {
    return rawImages.filter((rawImage) => {
      if (typeof rawImage === 'string') {
        return rawImage.trim().length > 0
      }

      if (!isRecord(rawImage)) {
        return false
      }

      return hasText(rawImage.imageUrl) || hasText(rawImage.url) || hasText(rawImage.src)
    }).length
  }

  return section.image_url ? 1 : 0
}

const countVoiceMessages = (section: RomanticSection): number => {
  if (section.type !== 'voice-messages') {
    return 0
  }

  if (!isRecord(section.content)) {
    return section.voice_note_url ? 1 : 0
  }

  const rawMessages = Array.isArray(section.content.messages) ? section.content.messages : []
  if (rawMessages.length === 0) {
    return section.voice_note_url ? 1 : 0
  }

  const messageCount = rawMessages.filter((rawMessage) => {
    if (!isRecord(rawMessage)) {
      return false
    }

    return (
      hasText(rawMessage.audioUrl) ||
      hasText(rawMessage.audio_url) ||
      hasText(rawMessage.voiceNoteUrl) ||
      hasText(rawMessage.url)
    )
  }).length

  return messageCount > 0 ? messageCount : section.voice_note_url ? 1 : 0
}

const countReasons = (section: RomanticSection): number => {
  if (section.type !== 'reasons-i-love-you' || !isRecord(section.content)) {
    return 0
  }

  const rawReasons = Array.isArray(section.content.reasons) ? section.content.reasons : []

  return rawReasons.filter((rawReason) => {
    if (typeof rawReason === 'string') {
      return rawReason.trim().length > 0
    }

    if (!isRecord(rawReason)) {
      return false
    }

    return hasText(rawReason.text) || hasText(rawReason.reason) || hasText(rawReason.title)
  }).length
}

const countLoveLetters = (section: RomanticSection): number => {
  if (section.type !== 'love-letter') {
    return 0
  }

  if (!isRecord(section.content)) {
    return 1
  }

  const rawLetters = Array.isArray(section.content.letters) ? section.content.letters : []
  if (rawLetters.length > 0) {
    const letterCount = rawLetters.filter((rawLetter) => {
      if (typeof rawLetter === 'string') {
        return rawLetter.trim().length > 0
      }

      if (!isRecord(rawLetter)) {
        return false
      }

      return hasText(rawLetter.letter) || hasText(rawLetter.text) || hasText(rawLetter.body) || hasText(rawLetter.title)
    }).length

    return letterCount > 0 ? letterCount : 1
  }

  return 1
}

const countEmotionalDoses = (section: RomanticSection): number => {
  if (section.type !== 'emotional-emergency-kit') {
    return 0
  }

  if (!isRecord(section.content)) {
    return defaultEmotionalEmergencyKitDoses.length
  }

  const rawDoses = Array.isArray(section.content.doses) ? section.content.doses : []
  if (rawDoses.length === 0) {
    return defaultEmotionalEmergencyKitDoses.length
  }

  const doseCount = rawDoses.filter((rawDose) => {
    if (!isRecord(rawDose)) {
      return false
    }

    return hasText(rawDose.title) || hasText(rawDose.message)
  }).length

  return doseCount > 0 ? doseCount : defaultEmotionalEmergencyKitDoses.length
}

const buildStoryCounts = (sections: RomanticSection[], kissCount: number): StoryCounts => {
  const enabledSections = sections.filter((item) => item.enabled)

  return enabledSections.reduce<StoryCounts>(
    (counts, currentSection) => ({
      galleryImages: counts.galleryImages + countGalleryImages(currentSection),
      voiceMessages: counts.voiceMessages + countVoiceMessages(currentSection),
      reasons: counts.reasons + countReasons(currentSection),
      kisses: kissCount,
      loveLetters: counts.loveLetters + countLoveLetters(currentSection),
      emotionalDoses: counts.emotionalDoses + countEmotionalDoses(currentSection),
    }),
    {
      galleryImages: 0,
      voiceMessages: 0,
      reasons: 0,
      kisses: kissCount,
      loveLetters: 0,
      emotionalDoses: 0,
    },
  )
}

const buildFloatingParticles = (): FloatingParticle[] => {
  const labels = ['❤️', '✨', '♡', '💕', '2', '✦']

  return Array.from({ length: 28 }, (_, index) => ({
    id: index,
    label: labels[index % labels.length] ?? '❤️',
    left: `${(index * 37 + 9) % 100}%`,
    top: `${(index * 53 + 13) % 100}%`,
    delay: (index % 9) * 0.22,
    duration: 7.6 + (index % 6) * 0.7,
    travel: 14 + (index % 5) * 6,
    sizeClassName: index % 5 === 0 ? 'text-2xl' : index % 2 === 0 ? 'text-sm' : 'text-xs',
  }))
}

const AnimatedNumber = ({ value, delay = 0, reduceMotion, className = '' }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0)
  const previousValueRef = useRef(0)
  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), [])

  useEffect(() => {
    if (value === null) {
      return
    }

    if (reduceMotion) {
      setDisplayValue(value)
      previousValueRef.current = value
      return
    }

    const controls = animate(previousValueRef.current, value, {
      duration: 1.15,
      delay,
      ease: sectionEase,
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest))
      },
    })

    previousValueRef.current = value

    return () => {
      controls.stop()
    }
  }, [delay, reduceMotion, value])

  return <span className={className}>{value === null ? '...' : numberFormatter.format(displayValue)}</span>
}

const FloatingParticles = memo(({ particles, reduceMotion }: FloatingParticlesProps) => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className={`absolute select-none text-rose-50/42 drop-shadow-[0_0_18px_rgba(251,207,232,0.55)] ${particle.sizeClassName}`}
          style={{ left: particle.left, top: particle.top }}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, -particle.travel, 0],
                  x: [0, particle.id % 2 === 0 ? 10 : -10, 0],
                  opacity: [0.2, 0.78, 0.2],
                  scale: [1, 1.24, 1],
                  rotate: [0, particle.id % 2 === 0 ? 8 : -8, 0],
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
                  type: 'tween',
                }
          }
        >
          {particle.label}
        </motion.span>
      ))}
    </div>
  )
})

FloatingParticles.displayName = 'OurStoryInNumbersFloatingParticles'

const StatCard = ({ stat, index, reduceMotion }: StatCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reduceMotion ? 0.14 : 0.58,
        delay: reduceMotion ? 0 : 0.24 + index * 0.045,
        ease: sectionEase,
      }}
      whileHover={reduceMotion ? undefined : { y: -5, scale: 1.018 }}
      className="group relative min-h-44 overflow-hidden rounded-[1.7rem] border border-white/18 bg-white/10 p-5 text-right shadow-[0_24px_70px_-52px_rgba(251,113,133,0.95)] backdrop-blur-xl transition will-change-transform hover:border-rose-100/34 hover:bg-white/14 sm:min-h-48 sm:p-6"
    >
      <div className={`pointer-events-none absolute inset-0 opacity-88 ${stat.accentClassName}`} />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-white/62 to-transparent" />
      <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-rose-200/16 blur-2xl transition group-hover:bg-rose-200/24" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-4">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-100/62">{stat.label}</span>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[1.15rem] border border-white/20 bg-white/12 text-2xl shadow-inner shadow-white/10 backdrop-blur-md">
            {stat.icon}
          </span>
        </div>

        <div>
          <AnimatedNumber
            value={stat.value}
            delay={reduceMotion ? 0 : 0.28 + index * 0.04}
            reduceMotion={reduceMotion}
            className="block text-5xl font-black leading-none tracking-[-0.06em] text-white [text-shadow:0_0_32px_rgba(251,207,232,0.34)] sm:text-6xl"
          />
          <p className="mt-3 text-sm font-semibold leading-6 text-rose-50/68">{stat.caption}</p>
        </div>
      </div>
    </motion.article>
  )
}

export const OurStoryInNumbersSection = ({ section, sections }: OurStoryInNumbersSectionProps) => {
  const reduceMotion = useReducedMotion()
  const content = useMemo(() => resolveOurStoryInNumbersContent(section), [section])
  const displayLabel = useMemo(() => getSectionDisplayLabel(section), [section])
  const sectionsForCounts = useMemo(() => sections ?? [section], [section, sections])
  const particles = useMemo(() => buildFloatingParticles(), [])
  const daysTogether = useMemo(() => getDaysTogether(), [])
  const { totalKisses, isLoading: isKissCountLoading, errorMessage: kissCountError } = useTotalKissCount()
  const counts = useMemo(() => buildStoryCounts(sectionsForCounts, totalKisses), [sectionsForCounts, totalKisses])
  const stats = useMemo<StoryStat[]>(
    () => [
      {
        id: 'gallery-images',
        icon: '📸',
        label: 'صورنا',
        value: counts.galleryImages,
        caption: 'صورة شايلة ضحكة أو لحظة قريبة من القلب',
        accentClassName: 'bg-[radial-gradient(circle_at_15%_15%,rgba(251,207,232,0.22),transparent_35%)]',
      },
      {
        id: 'voice-messages',
        icon: '🎧',
        label: 'فويسات',
        value: counts.voiceMessages,
        caption: 'رسالة صوتية موجودة عشان تسمعي قلبي',
        accentClassName: 'bg-[radial-gradient(circle_at_85%_18%,rgba(244,114,182,0.2),transparent_36%)]',
      },
      {
        id: 'reasons',
        icon: '💌',
        label: 'أسباب بحبك',
        value: counts.reasons,
        caption: 'سبب مكتوب عشان أفكرك إنك كل حاجة',
        accentClassName: 'bg-[radial-gradient(circle_at_18%_82%,rgba(253,164,175,0.2),transparent_36%)]',
      },
      {
        id: 'kisses',
        icon: '😘',
        label: 'بوسات',
        value: isKissCountLoading ? null : counts.kisses,
        caption: kissCountError ? 'الرقم هيتحدث أول ما السيرفر يرد' : 'بوسة متسجلة في عداد حبنا',
        accentClassName: 'bg-[radial-gradient(circle_at_80%_78%,rgba(251,113,133,0.24),transparent_36%)]',
      },
      {
        id: 'love-letters',
        icon: '💗',
        label: 'جوابات حب',
        value: counts.loveLetters,
        caption: 'جواب مكتوب مخصوص لقلبك يا أسماء',
        accentClassName: 'bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.18),transparent_34%)]',
      },
      {
        id: 'emotional-doses',
        icon: '🩹',
        label: 'جرعات طوارئ',
        value: counts.emotionalDoses,
        caption: 'جرعة حب جاهزة لأي لحظة تحتاج حضن',
        accentClassName: 'bg-[radial-gradient(circle_at_78%_26%,rgba(251,207,232,0.22),transparent_34%)]',
      },
    ],
    [counts.emotionalDoses, counts.galleryImages, counts.kisses, counts.loveLetters, counts.reasons, counts.voiceMessages, isKissCountLoading, kissCountError],
  )

  return (
    <motion.section
      dir="rtl"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.18 : 0.78, ease: sectionEase }}
      className="relative -mx-4 overflow-hidden bg-[radial-gradient(circle_at_18%_7%,rgba(251,207,232,0.34),transparent_30%),radial-gradient(circle_at_86%_16%,rgba(251,113,133,0.26),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(244,114,182,0.24),transparent_35%),linear-gradient(135deg,#170312_0%,#3d0a2d_38%,#7f1d46_68%,#09090b_100%)] px-4 py-12 text-white shadow-[0_42px_120px_-68px_rgba(244,63,94,0.98)] sm:mx-0 sm:rounded-[2.5rem] sm:px-8 sm:py-14 lg:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.13),transparent_38%,rgba(255,255,255,0.06)_68%,rgba(255,255,255,0.1))]" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-rose-100/70 to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-12 h-72 w-72 rounded-full bg-rose-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-28 bottom-12 h-80 w-80 rounded-full bg-pink-300/18 blur-3xl" />
      <FloatingParticles particles={particles} reduceMotion={reduceMotion} />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          {displayLabel ? (
            <motion.p
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.14 : 0.48, ease: sectionEase }}
              className="text-[11px] font-black uppercase tracking-[0.32em] text-rose-100/72 sm:text-xs"
            >
              {displayLabel}
            </motion.p>
          ) : null}

          <motion.h2
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.16 : 0.66, delay: reduceMotion ? 0 : 0.08, ease: sectionEase }}
            className={`${displayLabel ? 'mt-4' : ''} text-4xl font-black leading-[1.16] tracking-tight text-rose-50 [text-shadow:0_0_42px_rgba(251,207,232,0.42)] sm:text-6xl lg:text-7xl`}
          >
            {content.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.16 : 0.6, delay: reduceMotion ? 0 : 0.14, ease: sectionEase }}
            className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-8 text-rose-50/78 sm:text-xl sm:leading-9"
          >
            {content.subtitle}
          </motion.p>
        </div>

        <div className="mt-9 grid gap-4 lg:mt-12 lg:grid-cols-[1.04fr_1.36fr] lg:items-stretch lg:gap-5">
          <motion.article
            initial={{ opacity: 0, y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0.16 : 0.7, delay: reduceMotion ? 0 : 0.18, ease: sectionEase }}
            className="relative min-h-[23rem] overflow-hidden rounded-[2rem] border border-rose-100/28 bg-white/12 p-6 text-right shadow-[0_34px_100px_-58px_rgba(251,113,133,1)] backdrop-blur-2xl sm:p-8 lg:min-h-full"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_16%,rgba(255,255,255,0.24),transparent_34%),radial-gradient(circle_at_78%_76%,rgba(251,113,133,0.32),transparent_38%)]" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-white/80 to-transparent" />
            <motion.div
              aria-hidden
              animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.5, 0.82, 0.5] }}
              transition={reduceMotion ? undefined : { duration: 5.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              className="absolute left-8 top-8 h-28 w-28 rounded-full bg-rose-200/20 blur-3xl"
            />

            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-full border border-rose-100/28 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-rose-50/74 backdrop-blur-md">
                    منذ {relationshipStartDateLabel}
                  </span>
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.35rem] border border-white/24 bg-white/14 text-4xl shadow-inner shadow-white/10">
                    ❤️
                  </span>
                </div>

                <p className="mt-8 text-sm font-black uppercase tracking-[0.24em] text-rose-100/62">أيام مع بعض</p>
                <AnimatedNumber
                  value={daysTogether}
                  reduceMotion={reduceMotion}
                  className="mt-4 block text-7xl font-black leading-none tracking-[-0.08em] text-white [text-shadow:0_0_54px_rgba(251,207,232,0.48)] sm:text-8xl lg:text-9xl"
                />
              </div>

              <p className="max-w-md text-xl font-bold leading-9 text-rose-50/82 sm:text-2xl">
                كل يوم من دول كان صفحة صغيرة في حكاية كبيرة... ولسه أجمل صفحاتها جاية.
              </p>
            </div>
          </motion.article>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat, index) => (
              <StatCard key={stat.id} stat={stat} index={index} reduceMotion={reduceMotion} />
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.15fr] lg:items-stretch">
          <motion.article
            initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0.16 : 0.62, delay: reduceMotion ? 0 : 0.52, ease: sectionEase }}
            whileHover={reduceMotion ? undefined : { y: -5, scale: 1.012 }}
            className="relative overflow-hidden rounded-[2rem] border border-amber-100/36 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(251,207,232,0.12)_45%,rgba(251,191,36,0.12))] p-6 text-right shadow-[0_30px_90px_-56px_rgba(251,191,36,0.8)] backdrop-blur-2xl sm:p-8"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(254,243,199,0.26),transparent_34%),radial-gradient(circle_at_88%_78%,rgba(251,113,133,0.2),transparent_34%)]" />
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-100/76">أفضل قرار في حياتي</p>
              <p className="mt-5 text-6xl font-black leading-none tracking-[-0.07em] text-white [text-shadow:0_0_42px_rgba(254,243,199,0.34)] sm:text-7xl">
                04/04/2024
              </p>
              <p className="mt-5 text-xl font-bold leading-8 text-rose-50/82">اليوم اللي قابلت فيه أسماء ❤️</p>
            </div>
          </motion.article>

          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.16 : 0.62, delay: reduceMotion ? 0 : 0.58, ease: sectionEase }}
            className="relative overflow-hidden rounded-[2rem] border border-white/18 bg-white/9 p-6 text-center shadow-[0_28px_80px_-58px_rgba(251,113,133,0.9)] backdrop-blur-2xl sm:p-8"
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_44%,rgba(251,207,232,0.14))]" />
            <div className="relative z-10 flex min-h-52 flex-col items-center justify-center">
              <p className="text-2xl font-black leading-10 text-rose-50 sm:text-3xl sm:leading-[3rem]">
                كل الأرقام دي جميلة...
                <br />
                بس أجمل رقم فيهم كلهم...
                <br />
                <span className="inline-block bg-gradient-to-l from-rose-100 via-pink-200 to-amber-100 bg-clip-text text-5xl text-transparent [text-shadow:0_0_34px_rgba(251,207,232,0.2)] sm:text-6xl">
                  هو 2 ❤️
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
