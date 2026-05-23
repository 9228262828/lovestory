import type { RomanticSection } from '@/types/section'

interface AdminSectionsTableProps {
  sections: RomanticSection[]
  busySectionIds: string[]
  onToggleEnabled: (section: RomanticSection) => void
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void
  onEditSection: (section: RomanticSection) => void
  onDeleteSection: (section: RomanticSection) => void
}

const formatDateTime = (value: string): string => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

export const AdminSectionsTable = ({
  sections,
  busySectionIds,
  onToggleEnabled,
  onMoveSection,
  onEditSection,
  onDeleteSection,
}: AdminSectionsTableProps) => {
  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 p-4 text-sm text-zinc-300">
        No sections found. Create one to get started.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-[860px] w-full divide-y divide-zinc-800 text-left text-sm">
        <thead className="bg-zinc-900/80 text-zinc-300">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Enabled</th>
            <th className="px-4 py-3 font-medium">Order</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800 bg-zinc-950">
          {sections.map((section, index) => {
            const isBusy = busySectionIds.includes(section.id)
            const isFirst = index === 0
            const isLast = index === sections.length - 1

            return (
              <tr key={section.id} className="align-top">
                <td className="px-4 py-3 text-zinc-100">{section.title}</td>
                <td className="px-4 py-3 uppercase tracking-wide text-zinc-300">{section.type}</td>
                <td className="px-4 py-3 text-zinc-300">{section.enabled ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-zinc-300">{section.order_index}</td>
                <td className="px-4 py-3 text-zinc-400">{formatDateTime(section.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onToggleEnabled(section)
                      }}
                      className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy}
                    >
                      {section.enabled ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onMoveSection(section.id, 'up')
                      }}
                      className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy || isFirst}
                    >
                      Up
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onMoveSection(section.id, 'down')
                      }}
                      className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy || isLast}
                    >
                      Down
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onEditSection(section)
                      }}
                      className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onDeleteSection(section)
                      }}
                      className="rounded-md border border-red-800 px-2.5 py-1 text-xs font-semibold text-red-300 hover:border-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
