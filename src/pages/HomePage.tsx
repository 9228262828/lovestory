import { SectionRenderer } from '@/features/sections/components/SectionRenderer'
import { usePublicSections } from '@/features/sections/hooks/usePublicSections'
import { FinalForeverEnding } from '@/features/love-ending/components/FinalForeverEnding'
import { LoveEntryGate } from '@/features/love-entry/components/LoveEntryGate'

const HomePageContent = () => {
  const { sections, isLoading, errorMessage } = usePublicSections()
  const hasCinematicIntroAsFirstSection = sections[0]?.type === 'cinematic-intro'

  return (
    <div className={hasCinematicIntroAsFirstSection ? 'space-y-0' : 'space-y-6'}>
      {!hasCinematicIntroAsFirstSection ? (
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Public Website</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Romantic Interactive Experience
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600 sm:text-base">
            This page renders only enabled sections from Supabase in dynamic order.
          </p>
        </header>
      ) : null}

      {isLoading ? <p className="text-sm text-zinc-600">Loading sections...</p> : null}

      {errorMessage ? (
        <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      {!isLoading && !errorMessage && sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-200 bg-white/70 p-6 text-sm text-zinc-600">
          No sections are enabled yet. Add or enable sections from admin dashboard.
        </div>
      ) : null}

      {sections.length > 0 ? <SectionRenderer sections={sections} /> : null}

      <FinalForeverEnding />
    </div>
  )
}

export const HomePage = () => {
  return (
    <LoveEntryGate>
      <HomePageContent />
    </LoveEntryGate>
  )
}
