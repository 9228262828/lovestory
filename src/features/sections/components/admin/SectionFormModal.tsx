import { useEffect, useMemo, useState } from 'react'
import type { SectionUpsertInput } from '@/services/supabase/sections.service'
import type { JsonValue, RomanticSection } from '@/types/section'

type FormMode = 'create' | 'edit'

interface SectionFormModalProps {
  isOpen: boolean
  mode: FormMode
  section: RomanticSection | null
  typeOptions: string[]
  defaultOrderIndex: number
  isSubmitting: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (payload: SectionUpsertInput) => Promise<boolean>
}

const stringifyContent = (content: JsonValue): string => {
  return JSON.stringify(content, null, 2)
}

export const SectionFormModal = ({
  isOpen,
  mode,
  section,
  typeOptions,
  defaultOrderIndex,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: SectionFormModalProps) => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [orderIndex, setOrderIndex] = useState('0')
  const [contentText, setContentText] = useState('{}')
  const [validationErrorMessage, setValidationErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (mode === 'edit' && section) {
      setTitle(section.title)
      setType(section.type)
      setEnabled(section.enabled)
      setOrderIndex(section.order_index.toString())
      setContentText(stringifyContent(section.content))
      setValidationErrorMessage(null)
      return
    }

    setTitle('')
    setType(typeOptions[0] ?? '')
    setEnabled(true)
    setOrderIndex(defaultOrderIndex.toString())
    setContentText('{}')
    setValidationErrorMessage(null)
  }, [defaultOrderIndex, isOpen, mode, section, typeOptions])

  const modalTitle = useMemo(() => {
    return mode === 'create' ? 'Create section' : 'Edit section'
  }, [mode])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/80 px-4 py-8 sm:items-center">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">{modalTitle}</h2>
            <p className="text-sm text-zinc-400">All values are persisted directly to Supabase.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          >
            Close
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            setValidationErrorMessage(null)

            const normalizedTitle = title.trim()
            const normalizedType = type.trim()

            if (normalizedTitle.length === 0) {
              setValidationErrorMessage('Title is required.')
              return
            }

            if (normalizedType.length === 0) {
              setValidationErrorMessage('Type is required.')
              return
            }

            const parsedOrderIndex = Number(orderIndex)
            if (!Number.isInteger(parsedOrderIndex)) {
              setValidationErrorMessage('Order index must be an integer number.')
              return
            }

            let parsedContent: JsonValue
            try {
              parsedContent = JSON.parse(contentText) as JsonValue
            } catch {
              setValidationErrorMessage('Content must be valid JSON.')
              return
            }

            void onSubmit({
              title: normalizedTitle,
              type: normalizedType,
              enabled,
              order_index: parsedOrderIndex,
              content: parsedContent,
            })
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="text-zinc-300">Title</span>
              <input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value)
                }}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
                placeholder="Section title"
                required
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="text-zinc-300">Type</span>
              <input
                list="section-type-options"
                value={type}
                onChange={(event) => {
                  setType(event.target.value)
                }}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
                placeholder="e.g. hero"
                required
              />
              <datalist id="section-type-options">
                {typeOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="text-zinc-300">Order index</span>
              <input
                type="number"
                step={1}
                value={orderIndex}
                onChange={(event) => {
                  setOrderIndex(event.target.value)
                }}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
                required
              />
            </label>

            <label className="flex items-end gap-2 pb-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => {
                  setEnabled(event.target.checked)
                }}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
              />
              Enabled
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-300">Content (JSON)</span>
            <textarea
              value={contentText}
              onChange={(event) => {
                setContentText(event.target.value)
              }}
              className="min-h-44 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
              spellCheck={false}
            />
          </label>

          {validationErrorMessage ? (
            <p className="rounded-md border border-amber-800 bg-amber-900/30 px-3 py-2 text-sm text-amber-300">
              {validationErrorMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-md border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">{errorMessage}</p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md border border-blue-700 bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create section' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
