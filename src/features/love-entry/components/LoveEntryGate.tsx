import { type FormEvent, type PropsWithChildren, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const REQUIRED_DATE_KEYS = ['04042024', '27102005', '31012026', '13112024'] as const
const UNLOCK_STORAGE_KEY = 'love-story-entry-unlocked-v1'
const EMPTY_DATE_VALUES = ['', '', '', '']

const floatingDecorations = [
  { label: 'heart-one', symbol: '♡', className: 'left-[8%] top-[12%] text-rose-300', delay: 0 },
  { label: 'sparkle-one', symbol: '✦', className: 'right-[12%] top-[18%] text-amber-200', delay: 0.4 },
  { label: 'heart-two', symbol: '♥', className: 'bottom-[16%] left-[14%] text-pink-300', delay: 0.8 },
  { label: 'sparkle-two', symbol: '✧', className: 'bottom-[20%] right-[10%] text-rose-200', delay: 1.2 },
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

export const LoveEntryGate = ({ children }: PropsWithChildren) => {
  const reduceMotion = useReducedMotion()
  const [isUnlocked, setIsUnlocked] = useState(hasStoredUnlock)
  const [dateValues, setDateValues] = useState<string[]>(EMPTY_DATE_VALUES)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorAttempt, setErrorAttempt] = useState(0)
  const [isUnlocking, setIsUnlocking] = useState(false)

  useEffect(() => {
    if (!isUnlocking) {
      return
    }

    const unlockDelay = reduceMotion ? 0 : 700
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
            className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/55 p-5 shadow-2xl shadow-rose-200/50 backdrop-blur-xl sm:p-8"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.55, ease: 'easeOut' }}
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-gradient-to-br from-rose-100 to-pink-200 text-3xl shadow-lg shadow-rose-200/60">
              🔐
            </div>

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
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                animate={
                  errorAttempt > 0 && !reduceMotion
                    ? {
                        x: [0, -6, 6, -4, 4, 0],
                      }
                    : undefined
                }
                transition={{ duration: 0.38, ease: 'easeOut' }}
              >
                {dateValues.map((dateValue, index) => (
                  <label key={index} className="block text-left">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">
                      Special date {index + 1}
                    </span>
                    <input
                      className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-center text-lg font-semibold tracking-[0.12em] text-rose-950 shadow-inner shadow-rose-100 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-200/70"
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="DD/MM/YYYY"
                      type="text"
                      value={dateValue}
                      aria-label={`Special date ${index + 1}`}
                      onChange={(event) => {
                        updateDateValue(index, event.target.value)
                      }}
                    />
                  </label>
                ))}
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
