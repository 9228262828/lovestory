import { type FormEvent, type PropsWithChildren, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const REQUIRED_DATE_KEYS = ['04042024', '27062025', '31012026'] as const
const UNLOCK_STORAGE_KEY = 'love-story-entry-unlocked-v1'
const EMPTY_DATE_VALUES = REQUIRED_DATE_KEYS.map(() => '')
const REQUIRED_DATE_KEY_SET = new Set<string>(REQUIRED_DATE_KEYS)

const floatingDecorations = [
  { label: 'heart-one', symbol: '♡', className: 'left-[8%] top-[12%] text-rose-300', delay: 0 },
  { label: 'sparkle-one', symbol: '✦', className: 'right-[12%] top-[18%] text-amber-200', delay: 0.4 },
  { label: 'heart-two', symbol: '♥', className: 'bottom-[16%] left-[14%] text-pink-300', delay: 0.8 },
  { label: 'sparkle-two', symbol: '✧', className: 'bottom-[20%] right-[10%] text-rose-200', delay: 1.2 },
] as const

const lockKeyIndicators = [
  { label: 'first key', accent: 'from-rose-400 to-pink-400' },
  { label: 'second key', accent: 'from-pink-400 to-fuchsia-400' },
  { label: 'third key', accent: 'from-amber-300 to-rose-400' },
] as const

const unlockBurstDecorations = [
  { label: 'heart-left', symbol: '♥', x: -70, y: -42, rotate: -18, delay: 0 },
  { label: 'sparkle-top-left', symbol: '✦', x: -40, y: -74, rotate: 16, delay: 0.04 },
  { label: 'heart-top-right', symbol: '♡', x: 46, y: -70, rotate: 18, delay: 0.08 },
  { label: 'sparkle-right', symbol: '✧', x: 78, y: -24, rotate: -10, delay: 0.12 },
  { label: 'heart-bottom-left', symbol: '💕', x: -52, y: 24, rotate: 10, delay: 0.16 },
  { label: 'sparkle-bottom-right', symbol: '✦', x: 44, y: 34, rotate: 24, delay: 0.2 },
] as const

const normalizeDateInput = (value: string): string | null => {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  const dateParts = trimmedValue.split(/\D+/).filter(Boolean)

  if (dateParts.length === 3) {
    const [day, month, year] = dateParts

    if (!day || !month || !year || day.length > 2 || month.length > 2 || year.length !== 4) {
      return null
    }

    return `${day.padStart(2, '0')}${month.padStart(2, '0')}${year}`
  }

  const digitsOnly = trimmedValue.replace(/\D/g, '')

  if (digitsOnly.length === 8) {
    return digitsOnly
  }

  return null
}

const getCorrectDateCount = (values: string[]): number => {
  const enteredDateKeys = new Set(
    values
      .map(normalizeDateInput)
      .filter((date): date is string => date !== null && REQUIRED_DATE_KEY_SET.has(date)),
  )

  return enteredDateKeys.size
}

const isCorrectDateValue = (value: string): boolean => {
  const normalizedDate = normalizeDateInput(value)

  return normalizedDate !== null && REQUIRED_DATE_KEY_SET.has(normalizedDate)
}

const hasCorrectDates = (values: string[]): boolean => {
  const normalizedDates = values.map(normalizeDateInput)

  if (normalizedDates.some((date) => date === null)) {
    return false
  }

  const enteredDateKeys = new Set(normalizedDates)

  return (
    enteredDateKeys.size === REQUIRED_DATE_KEYS.length &&
    REQUIRED_DATE_KEYS.every((requiredDateKey) => enteredDateKeys.has(requiredDateKey))
  )
}

const hasStoredUnlock = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(UNLOCK_STORAGE_KEY) === 'true'
}

type RomanticLockIllustrationProps = {
  activeKeyCount: number
  isUnlocking: boolean
  reduceMotion: boolean | null
}

const RomanticLockIllustration = ({ activeKeyCount, isUnlocking, reduceMotion }: RomanticLockIllustrationProps) => {
  const shouldReduceMotion = reduceMotion === true
  const isReadyToOpen = activeKeyCount === REQUIRED_DATE_KEYS.length
  const lockStatusText = isUnlocking
    ? 'The love lock is opening.'
    : `${activeKeyCount} of ${REQUIRED_DATE_KEYS.length} love keys are glowing.`

  return (
    <div className="mx-auto mb-6 w-full max-w-xs" aria-label={lockStatusText} role="img">
      <div className="relative mx-auto flex h-36 w-40 items-center justify-center sm:h-40 sm:w-44">
        <div className="absolute inset-x-4 bottom-3 h-20 rounded-full bg-rose-300/25 blur-2xl" aria-hidden />

        <AnimatePresence>
          {isUnlocking ? (
            <>
              {unlockBurstDecorations.map((decoration) => (
                <motion.span
                  key={decoration.label}
                  className="pointer-events-none absolute left-1/2 top-1/2 z-20 text-xl text-rose-400 drop-shadow-sm sm:text-2xl"
                  aria-hidden
                  initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.35, x: '-50%', y: '-50%' }}
                  animate={
                    shouldReduceMotion
                      ? { opacity: [0, 1, 0] }
                      : {
                          opacity: [0, 1, 0],
                          scale: [0.35, 1.14, 0.74],
                          x: `calc(-50% + ${decoration.x}px)`,
                          y: `calc(-50% + ${decoration.y}px)`,
                          rotate: decoration.rotate,
                        }
                  }
                  exit={{ opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0.22 : 0.82, delay: shouldReduceMotion ? 0 : decoration.delay }}
                >
                  {decoration.symbol}
                </motion.span>
              ))}
            </>
          ) : null}
        </AnimatePresence>

        <svg className="relative z-10 h-full w-full overflow-visible" viewBox="0 0 180 170" aria-hidden>
          <defs>
            <linearGradient id="love-lock-body" x1="38" x2="142" y1="72" y2="154" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff1f2" />
              <stop offset="0.5" stopColor="#fbcfe8" />
              <stop offset="1" stopColor="#fb7185" />
            </linearGradient>
            <linearGradient id="love-lock-shackle" x1="50" x2="130" y1="18" y2="84" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff7ed" />
              <stop offset="0.45" stopColor="#fda4af" />
              <stop offset="1" stopColor="#e11d48" />
            </linearGradient>
            <radialGradient id="love-lock-glow" cx="0" cy="0" r="1" gradientTransform="matrix(62 0 0 62 90 108)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" stopOpacity="0.92" />
              <stop offset="1" stopColor="#fda4af" stopOpacity="0" />
            </radialGradient>
          </defs>

          <motion.g
            animate={
              shouldReduceMotion
                ? undefined
                : isUnlocking
                  ? { x: -10, y: -20, rotate: -18 }
                  : isReadyToOpen
                    ? { y: -5, rotate: -3 }
                    : { x: 0, y: 0, rotate: 0 }
            }
            style={{ transformOrigin: '88px 84px' }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            <path
              d="M55 80V59C55 34 70 18 90 18C110 18 125 34 125 59V80"
              fill="none"
              stroke="url(#love-lock-shackle)"
              strokeLinecap="round"
              strokeWidth="16"
            />
            <path d="M67 76V59C67 42 77 31 90 31" fill="none" stroke="#fff7ed" strokeLinecap="round" strokeOpacity="0.72" strokeWidth="4" />
          </motion.g>

          <motion.g
            animate={
              shouldReduceMotion
                ? undefined
                : isUnlocking
                  ? { scale: 1.04, y: -2 }
                  : activeKeyCount === 2
                    ? { x: [0, -2, 2, -1, 1, 0] }
                    : isReadyToOpen
                      ? { scale: [1, 1.02, 1] }
                      : { x: 0, scale: 1 }
            }
            style={{ transformOrigin: '90px 112px' }}
            transition={
              activeKeyCount === 2 && !isUnlocking && !shouldReduceMotion
                ? { duration: 0.52, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.25 }
                : { duration: 0.5, ease: 'easeOut' }
            }
          >
            <rect x="38" y="72" width="104" height="82" rx="28" fill="url(#love-lock-body)" stroke="#fff7ed" strokeWidth="3" />
            <rect x="48" y="82" width="84" height="60" rx="20" fill="url(#love-lock-glow)" opacity={isReadyToOpen || isUnlocking ? 0.9 : 0.48} />
            <path
              d="M90 100C84.8 100 80.6 104.1 80.6 109.1C80.6 112.3 82.3 115.1 84.9 116.8V128.5C84.9 131.3 87.2 133.6 90 133.6C92.8 133.6 95.1 131.3 95.1 128.5V116.8C97.7 115.1 99.4 112.3 99.4 109.1C99.4 104.1 95.2 100 90 100Z"
              fill="#9f1239"
              opacity="0.82"
            />
            <motion.path
              d="M71 95C78 88 86 88 90 96C94 88 102 88 109 95C116 103 109 116 90 126C71 116 64 103 71 95Z"
              fill="#fff1f2"
              opacity="0.66"
              animate={shouldReduceMotion || !isReadyToOpen ? undefined : { opacity: [0.5, 0.88, 0.5], scale: [1, 1.05, 1] }}
              transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity }}
              style={{ transformOrigin: '90px 106px' }}
            />
          </motion.g>
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2" aria-hidden>
        {lockKeyIndicators.map((indicator, index) => {
          const isActive = index < activeKeyCount

          return (
            <motion.div
              key={indicator.label}
              className={`relative overflow-hidden rounded-2xl border px-2 py-2 shadow-sm transition ${
                isActive
                  ? 'border-white/90 bg-white/80 text-rose-500 shadow-rose-200/80'
                  : 'border-white/60 bg-white/35 text-rose-200 shadow-white/40'
              }`}
              animate={
                shouldReduceMotion
                  ? undefined
                  : isActive
                    ? { y: [0, -2, 0], scale: [1, 1.04, 1] }
                    : { y: 0, scale: 1 }
              }
              transition={{ duration: 1.4, ease: 'easeInOut', repeat: isActive && !shouldReduceMotion ? Infinity : 0 }}
            >
              <span
                className={`absolute inset-0 bg-gradient-to-br ${indicator.accent} opacity-0 transition-opacity duration-300 ${
                  isActive ? 'opacity-[0.18]' : ''
                }`}
              />
              <svg className="relative mx-auto h-5 w-11 drop-shadow-sm" viewBox="0 0 52 24" aria-hidden>
                <circle cx="11" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="3" />
                <path d="M18 12H45M34 12V17M41 12V16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              </svg>
              <span className="sr-only">{indicator.label}</span>
            </motion.div>
          )
        })}
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-rose-500/80">
        {activeKeyCount}/{REQUIRED_DATE_KEYS.length} keys glowing
      </p>
    </div>
  )
}

export const LoveEntryGate = ({ children }: PropsWithChildren) => {
  const reduceMotion = useReducedMotion()
  const [isUnlocked, setIsUnlocked] = useState(hasStoredUnlock)
  const [dateValues, setDateValues] = useState<string[]>(EMPTY_DATE_VALUES)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorAttempt, setErrorAttempt] = useState(0)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const activeKeyCount = getCorrectDateCount(dateValues)

  useEffect(() => {
    if (!isUnlocking) {
      return
    }

    const unlockDelay = reduceMotion ? 0 : 1050
    const timeoutId = window.setTimeout(() => {
      setIsUnlocked(true)
    }, unlockDelay)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isUnlocking, reduceMotion])

  const updateDateValue = (index: number, value: string) => {
    setDateValues((currentValues) => currentValues.map((currentValue, currentIndex) => (currentIndex === index ? value : currentValue)))

    if (errorMessage) {
      setErrorMessage(null)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasCorrectDates(dateValues)) {
      setErrorMessage('قريبة يا روحي... جربي التواريخ اللي قلب أحمد فاكرها.')
      setErrorAttempt((currentAttempt) => currentAttempt + 1)
      return
    }

    window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true')
    setErrorMessage(null)
    setIsUnlocking(true)
  }

  return (
    <AnimatePresence mode="wait">
      {!isUnlocked ? (
        <motion.section
          key="love-entry-gate"
          className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-2 py-8 text-center sm:px-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.03, filter: 'blur(10px)' }}
          transition={{ duration: reduceMotion ? 0.01 : 0.65, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 -z-20 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.2),transparent_30%),linear-gradient(135deg,rgba(255,241,242,0.95),rgba(253,242,248,0.88),rgba(255,255,255,0.82))]" />
          <div className="absolute left-1/2 top-12 -z-10 h-52 w-52 -translate-x-1/2 rounded-full bg-rose-200/40 blur-3xl sm:h-72 sm:w-72" />
          <div className="absolute bottom-10 right-4 -z-10 h-36 w-36 rounded-full bg-pink-300/30 blur-3xl sm:h-56 sm:w-56" />

          {floatingDecorations.map((decoration) => (
            <motion.span
              key={decoration.label}
              className={`pointer-events-none absolute text-3xl sm:text-5xl ${decoration.className}`}
              aria-hidden
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, -12, 0],
                      opacity: [0.36, 0.9, 0.36],
                      scale: [0.92, 1.08, 0.92],
                    }
              }
              transition={{
                duration: 4,
                delay: decoration.delay,
                ease: 'easeInOut',
                repeat: reduceMotion ? 0 : Infinity,
              }}
            >
              {decoration.symbol}
            </motion.span>
          ))}

          <motion.div
            className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/55 p-5 shadow-2xl shadow-rose-200/50 backdrop-blur-xl sm:p-8"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.55, ease: 'easeOut' }}
          >
            <RomanticLockIllustration activeKeyCount={activeKeyCount} isUnlocking={isUnlocking} reduceMotion={reduceMotion} />

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-400">Love Story Gate</p>
              <h1 className="text-3xl font-semibold tracking-tight text-rose-950 sm:text-4xl">
                Before you enter our world...
              </h1>
              <p className="mx-auto max-w-md text-balance text-base leading-7 text-rose-900/75" dir="rtl">
                اكتبي التواريخ اللي قلبي فاكرها عشان أفتحلك الحكاية ❤️
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <motion.div
                key={errorAttempt}
                className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                animate={
                  errorAttempt > 0 && !reduceMotion
                    ? {
                        x: [0, -6, 6, -4, 4, 0],
                      }
                    : undefined
                }
                transition={{ duration: 0.38, ease: 'easeOut' }}
              >
                {dateValues.map((dateValue, index) => {
                  const hasActiveKey = isCorrectDateValue(dateValue)

                  return (
                    <label key={index} className="block text-left">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">
                        Special date {index + 1}
                      </span>
                      <input
                        className={`w-full rounded-2xl border bg-white/70 px-4 py-3 text-center text-lg font-semibold tracking-[0.12em] text-rose-950 shadow-inner outline-none transition focus:bg-white focus:ring-4 ${
                          hasActiveKey
                            ? 'border-rose-300 shadow-rose-200 ring-4 ring-rose-100'
                            : 'border-white/80 shadow-rose-100 focus:border-rose-300 focus:ring-rose-200/70'
                        }`}
                        inputMode="numeric"
                        maxLength={12}
                        placeholder="DD/MM/YYYY"
                        type="text"
                        value={dateValue}
                        aria-label={`Special date ${index + 1}`}
                        aria-invalid={errorMessage ? true : undefined}
                        onChange={(event) => {
                          updateDateValue(index, event.target.value)
                        }}
                      />
                    </label>
                  )
                })}
              </motion.div>

              <AnimatePresence>
                {errorMessage ? (
                  <motion.p
                    key="love-entry-error"
                    className="rounded-2xl border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700"
                    initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
                    role="alert"
                  >
                    {errorMessage}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <motion.button
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 px-6 py-4 text-base font-bold text-white shadow-xl shadow-rose-300/50 transition hover:shadow-rose-300/70 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-wait disabled:opacity-80"
                type="submit"
                disabled={isUnlocking}
                whileHover={reduceMotion || isUnlocking ? undefined : { scale: 1.015 }}
                whileTap={reduceMotion || isUnlocking ? undefined : { scale: 0.985 }}
              >
                <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
                <span className="relative">{isUnlocking ? 'Opening our story...' : 'Unlock our story 💗'}</span>
              </motion.button>
            </form>

            <p className="mt-5 text-xs leading-6 text-rose-900/55" dir="rtl">
              السر محفوظ بينكم بس. اكتبيها بأي شكل تحبيه: / أو - أو . أو من غير فواصل.
            </p>
          </motion.div>
        </motion.section>
      ) : (
        <motion.div
          key="love-story-content"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.7, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
