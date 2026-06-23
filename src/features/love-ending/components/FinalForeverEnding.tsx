import { motion, useReducedMotion } from 'framer-motion'

const floatingSymbols = [
  { label: 'soft-heart-left', symbol: '♡', className: 'left-[9%] top-[18%] text-rose-200', delay: 0 },
  { label: 'soft-star-right', symbol: '✦', className: 'right-[12%] top-[16%] text-amber-200', delay: 0.5 },
  { label: 'soft-heart-bottom', symbol: '♥', className: 'bottom-[18%] right-[18%] text-pink-200', delay: 1 },
  { label: 'soft-star-bottom', symbol: '✧', className: 'bottom-[16%] left-[16%] text-rose-100', delay: 1.4 },
] as const

const endingLines = [
  'الحكاية دي عمرها ما هتنتهي...',
  'إحنا مكملين سوا، خطوة بخطوة، لحد آخر العمر.',
  'ومهما الأيام عدّت، ومهما الدنيا اتغيرت،',
  'قلبي عمره ما هيبطل يدق بحبك.',
  'هفضل أحبك...',
] as const

export const FinalForeverEnding = () => {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      className="relative isolate mt-10 overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-rose-50 via-pink-50 to-white px-5 py-14 text-center shadow-2xl shadow-rose-100/80 sm:mt-14 sm:px-8 sm:py-20"
      dir="rtl"
      initial={reduceMotion ? false : { opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.9, ease: 'easeOut' }}
      aria-label="Final forever ending"
    >
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(251,207,232,0.5),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(254,205,211,0.48),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(255,241,242,0.92))]" />
      <div className="absolute left-1/2 top-8 -z-10 h-44 w-44 -translate-x-1/2 rounded-full bg-rose-200/30 blur-3xl sm:h-64 sm:w-64" />
      <div className="absolute bottom-4 left-8 -z-10 h-36 w-36 rounded-full bg-amber-100/50 blur-3xl sm:h-52 sm:w-52" />

      {floatingSymbols.map((item) => (
        <motion.span
          key={item.label}
          className={`pointer-events-none absolute text-2xl sm:text-4xl ${item.className}`}
          aria-hidden
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, -10, 0],
                  opacity: [0.28, 0.72, 0.28],
                  scale: [0.94, 1.08, 0.94],
                }
          }
          transition={{
            duration: 5.6,
            delay: item.delay,
            ease: 'easeInOut',
            repeat: reduceMotion ? 0 : Infinity,
          }}
        >
          {item.symbol}
        </motion.span>
      ))}

      <div className="mx-auto max-w-3xl">
        <motion.p
          className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-rose-300"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.55, delay: reduceMotion ? 0 : 0.12 }}
        >
          Final Forever Ending
        </motion.p>

        <motion.div
          className="space-y-4 text-pretty text-xl font-medium leading-10 text-rose-950/82 sm:text-2xl sm:leading-[3.2rem]"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.8, delay: reduceMotion ? 0 : 0.22 }}
        >
          {endingLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </motion.div>

        <motion.p
          className="mt-8 bg-gradient-to-l from-rose-700 via-pink-600 to-rose-500 bg-clip-text text-3xl font-black leading-tight text-transparent drop-shadow-sm sm:mt-10 sm:text-5xl"
          initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.75, delay: reduceMotion ? 0 : 0.5, ease: 'easeOut' }}
        >
          لحد آخر نفس فيا ❤️
        </motion.p>
      </div>
    </motion.section>
  )
}
