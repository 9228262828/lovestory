import { useEffect, useState } from 'react'
import { sectionsService } from '@/services/supabase/sections.service'
import type { RomanticSection } from '@/types/section'

export const AdminPage = () => {
  const [sections, setSections] = useState<RomanticSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadSections = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await sectionsService.getAllSections()

        if (isMounted) {
          setSections(response)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load section data.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSections()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Admin Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">Section Management</h1>
        <p className="text-sm text-zinc-400">Architecture-only placeholder for future CRUD controls.</p>
      </header>

      {isLoading ? <p className="text-sm text-zinc-300">Loading section data...</p> : null}

      {errorMessage ? (
        <p className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">{errorMessage}</p>
      ) : null}

      {!isLoading && !errorMessage ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
            <thead className="bg-zinc-900/80 text-zinc-300">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950">
              {sections.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-400" colSpan={4}>
                    No sections available yet.
                  </td>
                </tr>
              ) : (
                sections.map((section) => (
                  <tr key={section.id}>
                    <td className="px-4 py-3 text-zinc-300">{section.order_index}</td>
                    <td className="px-4 py-3 text-zinc-100">{section.title}</td>
                    <td className="px-4 py-3 uppercase tracking-wide text-zinc-400">{section.type}</td>
                    <td className="px-4 py-3 text-zinc-300">{section.enabled ? 'Yes' : 'No'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
