import { useState } from 'react'
import { useDailyKissCount } from '@/hooks/useDailyKissCount'
import { AdminSectionsTable } from '@/features/sections/components/admin/AdminSectionsTable'
import { SectionFormModal } from '@/features/sections/components/admin/SectionFormModal'
import { useAdminSections } from '@/features/sections/hooks/useAdminSections'
import type { RomanticSection } from '@/types/section'

type FormMode = 'create' | 'edit'

export const AdminPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingSection, setEditingSection] = useState<RomanticSection | null>(null)
  const { todayKisses, yesterdayKisses, isLoading: isKissCountLoading, errorMessage: kissCountError } = useDailyKissCount()

  const {
    sections,
    sectionTypeOptions,
    isLoading,
    isFormSubmitting,
    busySectionIds,
    loadErrorMessage,
    mutationErrorMessage,
    formErrorMessage,
    nextOrderIndex,
    reloadSections,
    clearMutationError,
    clearFormError,
    createSection,
    updateSection,
    deleteSection,
    toggleSectionEnabled,
    moveSection,
  } = useAdminSections()

  const openCreateForm = () => {
    clearFormError()
    setEditingSection(null)
    setFormMode('create')
    setIsFormOpen(true)
  }

  const openEditForm = (section: RomanticSection) => {
    clearFormError()
    setEditingSection(section)
    setFormMode('edit')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Admin Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight">Section Management</h1>
          <p className="text-sm text-zinc-400">
            Manage dynamic section records from Supabase with create, update, delete, toggle, and order controls.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-md border border-blue-700 bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          New section
        </button>
      </header>

      <section className="rounded-xl border border-rose-900/30 bg-gradient-to-r from-rose-950/40 via-pink-950/35 to-zinc-950/30 p-4 shadow-inner shadow-rose-950/20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300/90">Live Kiss Counter Today</p>
        <p className="mt-2 text-3xl font-semibold text-rose-100">{isKissCountLoading ? '...' : todayKisses}</p>
        <p className="mt-1 text-xs text-rose-200/80">Yesterday: {yesterdayKisses}</p>
        {kissCountError ? <p className="mt-2 text-xs text-amber-300">{kissCountError}</p> : null}
      </section>

      {isLoading ? <p className="text-sm text-zinc-300">Loading section data...</p> : null}

      {loadErrorMessage ? (
        <div className="space-y-3 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">
          <p>{loadErrorMessage}</p>
          <button
            type="button"
            onClick={() => {
              void reloadSections()
            }}
            className="rounded-md border border-red-800 px-3 py-1.5 text-xs font-semibold text-red-200 hover:border-red-700"
          >
            Retry
          </button>
        </div>
      ) : null}

      {mutationErrorMessage ? (
        <div className="space-y-3 rounded-lg border border-amber-900/60 bg-amber-950/20 p-3 text-sm text-amber-200">
          <p>{mutationErrorMessage}</p>
          <button
            type="button"
            onClick={clearMutationError}
            className="rounded-md border border-amber-700 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:border-amber-600"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {!loadErrorMessage ? (
        <AdminSectionsTable
          sections={sections}
          busySectionIds={busySectionIds}
          onToggleEnabled={(section) => {
            void toggleSectionEnabled(section)
          }}
          onMoveSection={(sectionId, direction) => {
            void moveSection(sectionId, direction)
          }}
          onEditSection={openEditForm}
          onDeleteSection={(section) => {
            const isConfirmed = window.confirm(
              `Delete section "${section.title}"? This action cannot be undone.`,
            )
            if (!isConfirmed) {
              return
            }

            void deleteSection(section.id)
          }}
        />
      ) : null}

      <SectionFormModal
        isOpen={isFormOpen}
        mode={formMode}
        section={editingSection}
        typeOptions={sectionTypeOptions}
        defaultOrderIndex={nextOrderIndex}
        isSubmitting={isFormSubmitting}
        errorMessage={formErrorMessage}
        onClose={closeForm}
        onSubmit={async (payload) => {
          const isSuccess =
            formMode === 'create'
              ? await createSection(payload)
              : editingSection
                ? await updateSection(editingSection.id, payload)
                : false

          if (isSuccess) {
            closeForm()
          }

          return isSuccess
        }}
      />
    </div>
  )
}
