import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThreeDGalleryContentEditor } from '@/features/sections/components/admin/ThreeDGalleryContentEditor'
import { UploadField } from '@/features/uploads/components/UploadField'
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

const parseContent = (value: string): JsonValue => {
  try {
    return JSON.parse(value) as JsonValue
  } catch {
    return {}
  }
}

interface SectionInitialValues {
  title: string
  type: string
  enabled: boolean
  orderIndex: string
  contentText: string
  imageUrl: string | null
  musicUrl: string | null
  voiceNoteUrl: string | null
}

const buildInitialValues = (
  mode: FormMode,
  section: RomanticSection | null,
  typeOptions: string[],
  defaultOrderIndex: number,
): SectionInitialValues => {
  if (mode === 'edit' && section) {
    return {
      title: section.title,
      type: section.type,
      enabled: section.enabled,
      orderIndex: section.order_index.toString(),
      contentText: stringifyContent(section.content),
      imageUrl: section.image_url ?? null,
      musicUrl: section.music_url ?? null,
      voiceNoteUrl: section.voice_note_url ?? null,
    }
  }

  return {
    title: '',
    type: typeOptions[0] ?? '',
    enabled: true,
    orderIndex: defaultOrderIndex.toString(),
    contentText: '{}',
    imageUrl: null,
    musicUrl: null,
    voiceNoteUrl: null,
  }
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
  const [validationErrorMessage, setValidationErrorMessage] = useState<string | null>(null)
  const modalTitle = mode === 'create' ? 'Create section' : 'Edit section'
  const initialValues = buildInitialValues(mode, section, typeOptions, defaultOrderIndex)
  const formInstanceKey = `${mode}-${section?.id ?? 'new'}`
  const initialParsedContent = useMemo(() => parseContent(initialValues.contentText), [initialValues.contentText])
  const [selectedType, setSelectedType] = useState(initialValues.type)
  const [contentText, setContentText] = useState(initialValues.contentText)
  const [galleryContent, setGalleryContent] = useState<JsonValue>(initialParsedContent)
  const galleryContentText = useMemo(() => stringifyContent(galleryContent), [galleryContent])
  const isThreeDGalleryType = selectedType.trim() === '3d-gallery'

  useEffect(() => {
    setValidationErrorMessage(null)
    setSelectedType(initialValues.type)
    setContentText(initialValues.contentText)
    setGalleryContent(initialParsedContent)
  }, [formInstanceKey, initialParsedContent, initialValues.contentText, initialValues.type])

  const handleTypeChange = useCallback(
    (nextType: string) => {
      const normalizedType = nextType.trim()

      if (normalizedType === '3d-gallery' && selectedType.trim() !== '3d-gallery') {
        setGalleryContent(parseContent(contentText))
      }

      if (normalizedType !== '3d-gallery' && selectedType.trim() === '3d-gallery') {
        setContentText(galleryContentText)
      }

      setSelectedType(nextType)
    },
    [contentText, galleryContentText, selectedType],
  )

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
          key={formInstanceKey}
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            setValidationErrorMessage(null)

            const formData = new FormData(event.currentTarget)
            const normalizedTitle = (formData.get('title')?.toString() ?? '').trim()
            const normalizedType = (formData.get('type')?.toString() ?? '').trim()

            if (normalizedTitle.length === 0) {
              setValidationErrorMessage('Title is required.')
              return
            }

            if (normalizedType.length === 0) {
              setValidationErrorMessage('Type is required.')
              return
            }

            const parsedOrderIndex = Number(formData.get('order_index')?.toString() ?? '')
            if (!Number.isInteger(parsedOrderIndex)) {
              setValidationErrorMessage('Order index must be an integer number.')
              return
            }

            let parsedContent: JsonValue
            try {
              const contentText = formData.get('content')?.toString() ?? ''
              parsedContent = JSON.parse(contentText) as JsonValue
            } catch {
              setValidationErrorMessage('Content must be valid JSON.')
              return
            }

            const enabledValue = formData.get('enabled')
            const enabled = enabledValue === 'on' || enabledValue === 'true' || enabledValue === '1'
            const imageUrl = (formData.get('image_url')?.toString() ?? '').trim() || null
            const musicUrl = (formData.get('music_url')?.toString() ?? '').trim() || null
            const voiceNoteUrl = (formData.get('voice_note_url')?.toString() ?? '').trim() || null

            void onSubmit({
              title: normalizedTitle,
              type: normalizedType,
              enabled,
              order_index: parsedOrderIndex,
              content: parsedContent,
              image_url: imageUrl,
              music_url: musicUrl,
              voice_note_url: voiceNoteUrl,
            })
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="text-zinc-300">Title</span>
              <input
                name="title"
                defaultValue={initialValues.title}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
                placeholder="Section title"
                required
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="text-zinc-300">Type</span>
              <input
                name="type"
                list="section-type-options"
                value={selectedType}
                onChange={(event) => {
                  handleTypeChange(event.currentTarget.value)
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
                name="order_index"
                type="number"
                step={1}
                defaultValue={initialValues.orderIndex}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
                required
              />
            </label>

            <label className="flex items-end gap-2 pb-2 text-sm text-zinc-300">
              <input
                name="enabled"
                type="checkbox"
                defaultChecked={initialValues.enabled}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
              />
              Enabled
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <UploadField
              label="Image"
              target="image"
              name="image_url"
              defaultValue={initialValues.imageUrl}
              disabled={isSubmitting}
              helperText="Image upload (optional)"
            />
            <UploadField
              label="Music"
              target="music"
              name="music_url"
              defaultValue={initialValues.musicUrl}
              disabled={isSubmitting}
              helperText="Music upload (optional)"
            />
          </div>

          <UploadField
            label="Voice note"
            target="voice-note"
            name="voice_note_url"
            defaultValue={initialValues.voiceNoteUrl}
            disabled={isSubmitting}
            helperText="Voice-note upload (optional)"
          />

          {isThreeDGalleryType ? (
            <>
              <ThreeDGalleryContentEditor
                initialContent={initialParsedContent}
                fallbackImageUrl={initialValues.imageUrl}
                resetKey={formInstanceKey}
                disabled={isSubmitting}
                onContentChange={setGalleryContent}
              />
              <input type="hidden" name="content" value={galleryContentText} />
            </>
          ) : (
            <label className="block space-y-1.5 text-sm">
              <span className="text-zinc-300">Content (JSON)</span>
              <textarea
                name="content"
                value={contentText}
                onChange={(event) => {
                  setContentText(event.currentTarget.value)
                }}
                className="min-h-44 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
                spellCheck={false}
              />
            </label>
          )}

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
