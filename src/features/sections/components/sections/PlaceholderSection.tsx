import { motion } from 'framer-motion'
import type { RomanticSection } from '@/types/section'

interface PlaceholderSectionProps {
  section: RomanticSection
}

export const PlaceholderSection = ({ section }: PlaceholderSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-rose-100 bg-white/80 p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">{section.title}</h2>
        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-rose-700">
          {section.type}
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-600">
        Placeholder renderer for this section type. Final romantic UI block is intentionally deferred.
      </p>
    </motion.section>
  )
}
