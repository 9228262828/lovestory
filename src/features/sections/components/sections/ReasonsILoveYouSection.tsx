import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { JsonValue, RomanticSection } from '@/types/section'

interface ReasonsILoveYouSectionProps {
  section: RomanticSection
}

interface ReasonItem {
  id: string
  text: string
}

interface ReasonsILoveYouContent {
  title: string
  subtitle: string
  reasons: ReasonItem[]
  shuffle: boolean
}

const sectionEase: [number, number, number, number] = [0.22, 1, 0.36, 1]
const defaultTitle = 'Reasons I Love Asmaa'
const defaultSubtitle = 'There are more reasons than I can count...'

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

const normalizeReason = (rawReason: JsonValue, index: number): ReasonItem | null => {
  if (typeof rawReason === 'string') {
    const reasonText = rawReason.trim()
    return reasonText.length > 0 ? { id: `reason-${index + 1}`, text: reasonText } : null
  }

  if (!isRecord(rawReason)) {
    return null
  }

  const reasonText =
    getOptionalString(rawReason.text) ||
    getOptionalString(rawReason.reason) ||
    getOptionalString(rawReason.title)

  if (reasonText.length === 0) {
    return null
  }

  return {
    id: getOptionalString(rawReason.id) || `reason-${index + 1}`,
    text: reasonText,
  }
}

const resolveReasonsContent = (section: RomanticSection): ReasonsILoveYouContent => {
  if (!isRecord(section.content)) {
    return {
      title: section.title || defaultTitle,
      subtitle: defaultSubtitle,
      reasons: [],
      shuffle: false,
    }
  }

  const rawReasons = Array.isArray(section.content.reasons) ? section.content.reasons : []
  const reasons = rawReasons
    .map((rawReason, index) => normalizeReason(rawReason, index))
    .filter((reason): reason is ReasonItem => reason !== null)

  return {
    title: getString(section.content.title, section.title || defaultTitle),
    subtitle: getString(section.content.subtitle, defaultSubtitle),
    reasons,
    shuffle: getBoolean(section.content.shuffle, false),
  }
}

const buildRevealOrder = (reasons: ReasonItem[], shouldShuffle: boolean): string[] => {
  const orderedIds = reasons.map((reason) => reason.id)

  if (!shouldShuffle) {
    return orderedIds
  }

  const shuffledIds = [...orderedIds]
  for (let index = shuffledIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentId = shuffledIds[index]
    shuffledIds[index] = shuffledIds[swapIndex]
    shuffledIds[swapIndex] = currentId
  }

  return shuffledIds
}

export const ReasonsILoveYouSection = ({ section }: ReasonsILoveYouSectionProps) => {
  const reduceMotion = useReducedMotion()
  const content = useMemo(() => resolveReasonsContent(section), [section])
  const [revealedReasonIds, setRevealedReasonIds] = useState<Set<string>>(() => new Set())
  const [activeReasonId, setActiveReasonId] = useState<string | null>(null)
  const [revealOrder] = useState(() => buildRevealOrder(content.reasons, content.shuffle))
  const revealedCount = revealedReasonIds.size
  const totalCount = content.reasons.length
  const hasReasons = totalCount > 0
  const isComplete = hasReasons && revealedCount >= totalCount
  const activeReason = content.reasons.find((reason) => reason.id === activeReasonId) ?? null

  const revealReason = useCallback((reasonId: string) => {
    setRevealedReasonIds((previousIds) => {
      if (previousIds.has(reasonId)) {
        return previousIds
      }

      const nextIds = new Set(previousIds)
      nextIds.add(reasonId)
      return nextIds
    })
    setActiveReasonId(reasonId)
  }, [])

  const revealNextReason = useCallback(() => {
    const nextReasonId = revealOrder.find((reasonId) => !revealedReasonIds.has(reasonId))

    if (nextReasonId) {
      revealReason(nextReasonId)
    }
  }, [revealOrder, revealReason, revealedReasonIds])

  return (
    <motion.section
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.18 : 0.68, ease: sectionEase }}
      className="relative -mx-4 overflow-hidden bg-[radial-gradient(circle_at_18%_14%,rgba(251,113,133,0.34),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(244,114,182,0.22),transparent_30%),linear-gradient(135deg,#2a071d_0%,#60183f_48%,#111827_100%)] px-4 py-10 text-white shadow-[0_32px_90px_-58px_rgba(244,63,94,0.95)] sm:mx-0 sm:rounded-[2.25rem] sm:px-8 sm:py-12 lg:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,rgba(255,255,255,0.1),transparent_42%,rgba(255,255,255,0.05))]" />
      <div className="pointer-events-none absolute -left-16 top-16 h-48 w-48 rounded-full bg-rose-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-12 h-56 w-56 rounded-full bg-pink-300/16 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.16 : 0.45, ease: sectionEase }}
            className="text-[11px] font-semibold uppercase tracking-[0.34em] text-rose-100/72 sm:text-xs"
          >
            One reason at a time
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.18 : 0.62, delay: reduceMotion ? 0 : 0.08, ease: sectionEase }}
            className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-rose-50 [text-shadow:0_0_34px_rgba(251,113,133,0.38)] sm:text-5xl lg:text-6xl"
          >
            {content.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.18 : 0.58, delay: reduceMotion ? 0 : 0.14, ease: sectionEase }}
            className="mx-auto mt-4 max-w-xl text-sm leading-6 text-rose-50/78 sm:text-lg sm:leading-8 lg:mx-0"
          >
            {content.subtitle}
          </motion.p>

          <div className="mt-7 rounded-[1.75rem] border border-white/14 bg-white/10 p-5 text-left shadow-[0_22px_70px_-52px_rgba(251,113,133,0.9)] backdrop-blur-md sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-rose-100/62">Revealed</p>
                <p className="mt-2 text-3xl font-semibold leading-none text-white">
                  {revealedCount}
                  <span className="text-lg text-rose-100/55">/{totalCount}</span>
                </p>
              </div>
              {content.shuffle ? (
                <span className="rounded-full border border-rose-100/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-100/72">
                  Shuffle on
                </span>
              ) : null}
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/12">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-rose-100 via-pink-300 to-rose-400"
                initial={false}
                animate={{ width: totalCount > 0 ? `${(revealedCount / totalCount) * 100}%` : '0%' }}
                transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: 'easeOut' }}
              />
            </div>

            <AnimatePresence mode="wait">
              {activeReason ? (
                <motion.blockquote
                  key={activeReason.id}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -8, scale: reduceMotion ? 1 : 0.99 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.42, ease: sectionEase }}
                  className="mt-6 rounded-3xl border border-rose-100/18 bg-rose-50/12 px-5 py-5 text-lg font-medium leading-8 text-rose-50 sm:text-xl sm:leading-9"
                >
                  &ldquo;{activeReason.text}&rdquo;
                </motion.blockquote>
              ) : (
                <motion.p
                  key="empty-active-reason"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.3 }}
                  className="mt-6 rounded-3xl border border-dashed border-rose-100/18 bg-white/6 px-5 py-5 text-sm leading-6 text-rose-50/64"
                >
                  {hasReasons ? 'Tap a hidden card or press Next to reveal the first reason.' : 'Add reasons in the section content to start revealing them here.'}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={revealNextReason}
              whileTap={{ scale: reduceMotion ? 1 : 0.97 }}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-rose-100/38 bg-white/12 px-6 py-3 text-sm font-semibold text-rose-50 transition hover:border-rose-100/68 hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/75 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
              disabled={!hasReasons || isComplete}
            >
              {!hasReasons ? 'Add reasons first' : isComplete ? 'Every reason is revealed' : 'Reveal next reason'}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {content.reasons.map((reason, index) => {
            const isRevealed = revealedReasonIds.has(reason.id)
            const isActive = activeReasonId === reason.id

            return (
              <motion.button
                key={reason.id}
                type="button"
                onClick={() => {
                  revealReason(reason.id)
                }}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0.14 : 0.52,
                  delay: reduceMotion ? 0 : 0.12 + index * 0.045,
                  ease: sectionEase,
                }}
                whileTap={{ scale: reduceMotion ? 1 : 0.985 }}
                className={`min-h-32 rounded-[1.5rem] border p-5 text-left backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/75 sm:min-h-40 ${
                  isRevealed
                    ? 'border-rose-100/32 bg-white/14 text-rose-50 shadow-[0_20px_58px_-44px_rgba(251,113,133,0.95)]'
                    : 'border-white/12 bg-white/8 text-rose-50/72 hover:border-rose-100/30 hover:bg-white/12'
                } ${isActive ? 'ring-1 ring-rose-100/48' : ''}`}
                aria-pressed={isRevealed}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-100/55">Reason {index + 1}</span>
                <AnimatePresence mode="wait" initial={false}>
                  {isRevealed ? (
                    <motion.span
                      key="revealed"
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0.1 : 0.32, ease: sectionEase }}
                      className="mt-4 block text-base font-medium leading-7 sm:text-lg"
                    >
                      {reason.text}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0.1 : 0.22 }}
                      className="mt-4 flex items-center gap-3 text-sm font-semibold"
                    >
                      <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50/12 text-lg">
                        ?
                      </span>
                      Tap to reveal
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}
