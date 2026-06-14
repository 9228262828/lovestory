import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  resolveEmotionalEmergencyKitContent,
  type EmotionalDose,
} from '@/features/sections/components/sections/emotionalEmergencyKit/content'
import type { RomanticSection } from '@/types/section'

interface EmotionalEmergencyKitSectionProps {
  section: RomanticSection
}

interface FloatingParticle {
  id: number
  label: string
  left: string
  top: string
  delay: number
  travel: number
  sizeClassName: string
}

const sectionEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

const buildFloatingParticles = (): FloatingParticle[] => {
  const labels = ['❤️', '✨', '💕', '✦', '💗', '♡']

  return Array.from({ length: 24 }, (_, index) => ({
    id: index,
    label: labels[index % labels.length] ?? '❤️',
    left: `${(index * 41 + 9) % 100}%`,
    top: `${(index * 29 + 17) % 100}%`,
    delay: (index % 8) * 0.28,
    travel: 12 + (index % 5) * 6,
    sizeClassName: index % 3 === 0 ? 'text-lg' : index % 3 === 1 ? 'text-sm' : 'text-xs',
  }))
}

const buildBurstParticles = (dose: EmotionalDose): FloatingParticle[] => {
  const labels = [dose.emoji, '❤️', '✨', '💕', '♡', '✦']

  return Array.from({ length: 18 }, (_, index) => ({
    id: index,
    label: labels[index % labels.length] ?? '❤️',
    left: `${12 + ((index * 31) % 76)}%`,
    top: `${8 + ((index * 23) % 78)}%`,
    delay: index * 0.025,
    travel: 26 + (index % 4) * 8,
    sizeClassName: index % 4 === 0 ? 'text-2xl' : index % 2 === 0 ? 'text-lg' : 'text-sm',
  }))
}

const EmptyDoseCard = () => {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-rose-100/28 bg-white/8 px-5 py-8 text-center text-sm leading-7 text-rose-50/72">
      ضيفي جرعات الحب من لوحة التحكم عشان الحقيبة تبقى جاهزة.
    </div>
  )
}

const FloatingParticles = ({
  particles,
  reduceMotion,
}: {
  particles: FloatingParticle[]
  reduceMotion: boolean | null
}) => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className={`absolute select-none text-rose-100/45 ${particle.sizeClassName}`}
          style={{ left: particle.left, top: particle.top }}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, -particle.travel, 0],
                  x: [0, particle.id % 2 === 0 ? 8 : -8, 0],
                  opacity: [0.22, 0.72, 0.22],
                  scale: [1, 1.2, 1],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 6.6 + (particle.id % 5),
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
}

const DoseBurst = ({
  dose,
  reduceMotion,
}: {
  dose: EmotionalDose
  reduceMotion: boolean | null
}) => {
  const burstParticles = useMemo(() => buildBurstParticles(dose), [dose])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.8rem]">
      {burstParticles.map((particle, index) => (
        <motion.span
          key={`${dose.id}-${particle.id}`}
          className={`absolute select-none ${particle.sizeClassName}`}
          style={{ left: particle.left, top: particle.top }}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.8, y: 0 }}
          animate={{
            opacity: reduceMotion ? 0.45 : [0, 1, 0],
            scale: reduceMotion ? 1 : [0.82, 1.22, 0.94],
            y: reduceMotion ? 0 : -particle.travel,
            rotate: reduceMotion ? 0 : index % 2 === 0 ? 14 : -14,
          }}
          transition={{ duration: reduceMotion ? 0.01 : 0.92, delay: reduceMotion ? 0 : particle.delay, ease: sectionEase }}
        >
          {particle.label}
        </motion.span>
      ))}
    </div>
  )
}

export const EmotionalEmergencyKitSection = ({ section }: EmotionalEmergencyKitSectionProps) => {
  const reduceMotion = useReducedMotion()
  const content = useMemo(() => resolveEmotionalEmergencyKitContent(section), [section])
  const floatingParticles = useMemo(() => (content.showParticles ? buildFloatingParticles() : []), [content.showParticles])
  const [activeDoseId, setActiveDoseId] = useState<string | null>(null)
  const activeDose = content.doses.find((dose) => dose.id === activeDoseId) ?? null

  return (
    <motion.section
      dir="rtl"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.18 : 0.72, ease: sectionEase }}
      className={`relative -mx-4 overflow-hidden bg-[radial-gradient(circle_at_20%_8%,rgba(251,207,232,0.32),transparent_31%),radial-gradient(circle_at_82%_16%,rgba(251,113,133,0.24),transparent_34%),linear-gradient(135deg,#fff1f2_0%,#fdf2f8_38%,#4c0519_100%)] px-4 py-10 text-rose-950 shadow-[0_36px_100px_-62px_rgba(244,63,94,0.9)] sm:mx-0 sm:rounded-[2.25rem] sm:px-8 sm:py-12 lg:px-10 ${
        content.enableGlow ? 'shadow-rose-500/35' : ''
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.5),transparent_38%,rgba(255,255,255,0.16))]" />
      <div className="pointer-events-none absolute -right-20 top-12 h-56 w-56 rounded-full bg-rose-300/28 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-12 h-64 w-64 rounded-full bg-pink-200/24 blur-3xl" />
      {content.showParticles ? <FloatingParticles particles={floatingParticles} reduceMotion={reduceMotion} /> : null}

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-7 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-9">
        <div className="mx-auto w-full max-w-2xl text-center lg:sticky lg:top-6 lg:mx-0 lg:text-right">
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0.14 : 0.58, ease: sectionEase }}
            className="mx-auto grid h-20 w-20 place-items-center rounded-[1.5rem] border border-white/70 bg-white/55 text-4xl shadow-[0_20px_55px_-32px_rgba(244,63,94,0.8)] backdrop-blur-md lg:mx-0"
          >
            🩹
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.14 : 0.45, delay: reduceMotion ? 0 : 0.06, ease: sectionEase }}
            className="mt-5 text-[11px] font-bold uppercase tracking-[0.24em] text-rose-800/70 sm:text-xs"
          >
            Emergency love kit
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.16 : 0.62, delay: reduceMotion ? 0 : 0.12, ease: sectionEase }}
            className={`mt-3 text-3xl font-black leading-[1.18] tracking-tight text-rose-950 sm:text-5xl lg:text-6xl ${
              content.enableGlow ? '[text-shadow:0_0_32px_rgba(244,114,182,0.4)]' : ''
            }`}
          >
            {content.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.16 : 0.56, delay: reduceMotion ? 0 : 0.18, ease: sectionEase }}
            className="mx-auto mt-4 max-w-xl text-base font-medium leading-8 text-rose-900/74 sm:text-lg sm:leading-9 lg:mx-0"
          >
            {content.subtitle}
          </motion.p>

          <AnimatePresence mode="wait">
            {activeDose ? (
              <motion.article
                key={activeDose.id}
                id={`emotional-prescription-${section.id}`}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -10, scale: reduceMotion ? 1 : 0.98 }}
                transition={{ duration: reduceMotion ? 0.14 : 0.5, ease: sectionEase }}
                className="relative mt-7 overflow-hidden rounded-[1.8rem] border border-white/72 bg-white/72 p-5 text-right shadow-[0_28px_80px_-44px_rgba(190,24,93,0.78)] backdrop-blur-md sm:p-6"
              >
                {content.showParticles ? <DoseBurst dose={activeDose} reduceMotion={reduceMotion} /> : null}
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3 border-b border-rose-200/70 pb-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-700/64">روشتة حب</p>
                      <h3 className="mt-1 text-2xl font-black text-rose-950">{activeDose.title}</h3>
                    </div>
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-2xl shadow-[0_14px_30px_-18px_rgba(190,24,93,0.9)]">
                      {activeDose.emoji}
                    </span>
                  </div>

                  <p className="mt-5 text-base font-semibold leading-8 text-rose-950/84 sm:text-lg sm:leading-9">
                    {activeDose.message}
                  </p>

                  <motion.button
                    type="button"
                    onClick={() => {
                      setActiveDoseId(null)
                    }}
                    whileTap={{ scale: reduceMotion ? 1 : 0.97 }}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-rose-300/80 bg-gradient-to-l from-rose-600 to-pink-500 px-6 py-3 text-sm font-black text-white shadow-[0_16px_35px_-22px_rgba(190,24,93,0.95)] transition hover:from-rose-500 hover:to-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/75 sm:w-auto"
                  >
                    حاسّة إني أحسن ❤️
                  </motion.button>
                </div>
              </motion.article>
            ) : (
              <motion.div
                key="emotional-kit-empty-prescription"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.28 }}
                className="mt-7 rounded-[1.6rem] border border-dashed border-rose-300/70 bg-white/36 px-5 py-5 text-sm font-semibold leading-7 text-rose-900/68 backdrop-blur-sm"
              >
                اختاري أي جرعة من الكروت، وافتحي الروشتة الصغيرة اللي جواها.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {content.doses.length > 0 ? (
            content.doses.map((dose, index) => {
              const isActive = activeDoseId === dose.id

              return (
                <motion.button
                  key={dose.id}
                  type="button"
                  aria-expanded={isActive}
                  aria-controls={`emotional-prescription-${section.id}`}
                  onClick={() => {
                    setActiveDoseId(dose.id)
                  }}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0, scale: isActive && !reduceMotion ? 1.035 : 1 }}
                  transition={{
                    duration: reduceMotion ? 0.14 : 0.5,
                    delay: reduceMotion ? 0 : 0.12 + index * 0.04,
                    ease: sectionEase,
                  }}
                  whileTap={{ scale: reduceMotion ? 1 : 0.97 }}
                  className={`group relative min-h-44 overflow-hidden rounded-[1.7rem] border p-4 text-right transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/75 ${
                    isActive
                      ? 'border-white/80 bg-white/82 shadow-[0_24px_70px_-42px_rgba(190,24,93,0.88)]'
                      : 'border-white/58 bg-white/46 shadow-[0_18px_52px_-42px_rgba(190,24,93,0.7)] hover:border-white/78 hover:bg-white/66'
                  }`}
                >
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_8%,rgba(255,255,255,0.7),transparent_35%),linear-gradient(145deg,rgba(255,255,255,0.46),transparent_50%)]" />
                  <span className="pointer-events-none absolute -left-8 -top-8 h-20 w-20 rounded-full bg-rose-300/24 blur-2xl transition group-hover:bg-rose-300/34" />

                  <span className="relative z-10 flex items-start justify-between gap-3">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-rose-100/80 bg-gradient-to-br from-white to-rose-100 text-2xl shadow-inner">
                      {dose.emoji}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-rose-700/62">
                        جرعة رقم {index + 1}
                      </span>
                      <span className="mt-2 block text-xl font-black leading-7 text-rose-950">{dose.title}</span>
                    </span>
                  </span>

                  <span className="relative z-10 mt-6 block overflow-hidden rounded-full border border-rose-200/80 bg-rose-50/85 p-1">
                    <span className="flex h-11 items-center rounded-full bg-gradient-to-l from-rose-500 via-pink-400 to-rose-200 shadow-inner">
                      <span className="mx-2 grid h-8 w-8 place-items-center rounded-full bg-white/74 text-sm">+</span>
                      <span className="h-full flex-1 border-x border-white/50 bg-white/20" />
                      <span className="mx-2 grid h-8 w-8 place-items-center rounded-full bg-white/74 text-sm">♡</span>
                    </span>
                  </span>

                  <span className="relative z-10 mt-4 block text-sm font-bold text-rose-900/70">
                    {isActive ? 'الروشتة مفتوحة دلوقتي ✨' : 'افتحي الجرعة'}
                  </span>
                </motion.button>
              )
            })
          ) : (
            <EmptyDoseCard />
          )}
        </div>
      </div>
    </motion.section>
  )
}
