import { useCallback, useMemo } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { useTotalKissCount } from '@/hooks/useTotalKissCount'
import { useKissStream } from '@/hooks/useKissStream'
import { getSectionDisplayLabel } from '@/features/sections/utils/sectionDisplayLabel'
import type { RomanticSection } from '@/types/section'

interface KissCounterSectionProps {
  section: RomanticSection
}

interface KissCounterContent {
  title: string
  subtitle: string
  buttonLabel: string
  counterLabel: string
}

const sectionEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

const resolveKissCounterContent = (): KissCounterContent => {
  return {
    title: 'عداد البوسات',
    subtitle: 'كل بوسة منك بتتحفظ في قلبي وتفضل منورة عداد حبنا ❤️',
    buttonLabel: 'ابعت بوسة يا عسول ❤️',
    counterLabel: 'بوسة على خدي ❤️',
  }
}

export const KissCounterSection = ({ section }: KissCounterSectionProps) => {
  const reduceMotion = useReducedMotion()
  const pulseControls = useAnimationControls()
  const content = useMemo(() => resolveKissCounterContent(), [])
  const displayLabel = useMemo(() => getSectionDisplayLabel(section), [section])
  const { totalKisses, isLoading } = useTotalKissCount()
  const { sendKiss, sendErrorMessage } = useKissStream()

  const handleKissClick = useCallback(
    () => {
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

      void sendKiss({
        source: 'kiss-counter-section',
        section_id: section.id,
      })
    },
    [pulseControls, reduceMotion, section.id, sendKiss],
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: sectionEase }}
      className="relative overflow-hidden rounded-[2rem] border border-rose-100/65 bg-gradient-to-br from-rose-100/70 via-pink-100/55 to-orange-100/50 px-5 py-7 shadow-[0_28px_65px_-48px_rgba(244,63,94,0.75)] sm:px-8 sm:py-9"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(251,113,133,0.22),transparent_44%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_82%,rgba(244,114,182,0.2),transparent_36%)]" />

      <motion.div animate={pulseControls} className="relative z-10 mx-auto max-w-2xl text-center">
        {displayLabel ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600/80">{displayLabel}</p>
        ) : null}
        <h2 className={`${displayLabel ? 'mt-3' : ''} text-2xl font-semibold tracking-tight text-zinc-900 sm:text-4xl`}>
          {content.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-700 sm:text-base">{content.subtitle}</p>

        <div className="mx-auto mt-7 w-full max-w-sm rounded-3xl border border-rose-100/70 bg-white/70 p-5 shadow-inner shadow-rose-200/40 sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-rose-600/85">{content.counterLabel}</p>
          <p className="mt-3 text-4xl font-semibold leading-none text-zinc-900 sm:text-5xl">
            {isLoading ? '...' : totalKisses}
          </p>
          <motion.button
            type="button"
            onClick={handleKissClick}
            whileTap={{ scale: reduceMotion ? 0.995 : 0.97 }}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-rose-300/75 bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(244,63,94,0.95)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/75"
          >
            {content.buttonLabel}
          </motion.button>
          {sendErrorMessage ? <p className="mt-3 text-xs text-rose-600">{sendErrorMessage}</p> : null}
        </div>
      </motion.div>
    </motion.section>
  )
}
