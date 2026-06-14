import { useCallback, useMemo, useState } from 'react'
import { ScrollableAdminModal } from '@/components/ui/ScrollableAdminModal'
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
    type: '',
    enabled: true,
    orderIndex: defaultOrderIndex.toString(),
    contentText: '{}',
    imageUrl: null,
    musicUrl: null,
    voiceNoteUrl: null,
  }
}

interface SectionFormFieldsProps {
  mode: FormMode
  typeOptions: string[]
  initialValues: SectionInitialValues
  isSubmitting: boolean
  isGalleryBulkUploadBusy: boolean
  errorMessage: string | null
  onClose: () => void
  onGalleryBulkUploadBusyChange: (isBusy: boolean) => void
  onSubmit: (payload: SectionUpsertInput) => Promise<boolean>
}

const SectionFormFields = ({
  mode,
  typeOptions,
  initialValues,
  isSubmitting,
  isGalleryBulkUploadBusy,
  errorMessage,
  onClose,
  onGalleryBulkUploadBusyChange,
  onSubmit,
}: SectionFormFieldsProps) => {
  const [validationErrorMessage, setValidationErrorMessage] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState(initialValues.type)
  const [contentText, setContentText] = useState(initialValues.contentText)
  const [galleryContent, setGalleryContent] = useState<JsonValue>(() => parseContent(initialValues.contentText))
  const galleryContentText = useMemo(() => stringifyContent(galleryContent), [galleryContent])
  const availableTypeOptions = useMemo(() => {
    const initialType = initialValues.type.trim()
    const options = initialType.length > 0 ? [...typeOptions, initialType] : typeOptions
    return Array.from(new Set(options)).sort((left, right) => left.localeCompare(right))
  }, [initialValues.type, typeOptions])
  const isThreeDGalleryType = selectedType.trim() === '3d-gallery'
  const isFormBusy = isSubmitting || isGalleryBulkUploadBusy

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

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        setValidationErrorMessage(null)

        if (isGalleryBulkUploadBusy) {
          setValidationErrorMessage('Wait for the bulk image upload to finish before saving.')
          return
        }

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
          const nextContentText = formData.get('content')?.toString() ?? ''
          parsedContent = JSON.parse(nextContentText) as JsonValue
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
      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 touch-pan-y focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 sm:px-6 sm:py-5"
        tabIndex={0}
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
              disabled={isFormBusy}
            />
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="text-zinc-300">Type</span>
            <select
              name="type"
              value={selectedType}
              onChange={(event) => {
                handleTypeChange(event.currentTarget.value)
              }}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
              required
              disabled={isFormBusy}
            >
              <option value="" disabled>
                Select a section type
              </option>
              {availableTypeOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </select>
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
              disabled={isFormBusy}
            />
          </label>

          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-300">
            <input
              name="enabled"
              type="checkbox"
              defaultChecked={initialValues.enabled}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
              disabled={isFormBusy}
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
            disabled={isFormBusy}
            helperText="Image upload (optional)"
          />
          <UploadField
            label="Music"
            target="music"
            name="music_url"
            defaultValue={initialValues.musicUrl}
            disabled={isFormBusy}
            helperText="Music upload (optional)"
          />
        </div>

        <UploadField
          label="Voice note"
          target="voice-note"
          name="voice_note_url"
          defaultValue={initialValues.voiceNoteUrl}
          disabled={isFormBusy}
          helperText="Voice-note upload (optional)"
        />

        {isThreeDGalleryType ? (
          <>
            <ThreeDGalleryContentEditor
              initialContent={galleryContent}
              fallbackImageUrl={initialValues.imageUrl}
              disabled={isFormBusy}
              onContentChange={setGalleryContent}
              onBulkUploadBusyChange={onGalleryBulkUploadBusyChange}
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
              disabled={isFormBusy}
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
      </div>

      <div className="sticky bottom-0 flex shrink-0 flex-wrap justify-end gap-2 border-t border-zinc-800 bg-zinc-900/95 px-4 py-3 sm:px-6 supports-[backdrop-filter]:bg-zinc-900/80 supports-[backdrop-filter]:backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isFormBusy}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md border border-blue-700 bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isFormBusy}
        >
          {isGalleryBulkUploadBusy ? 'Uploading images...' : isSubmitting ? 'Saving...' : mode === 'create' ? 'Create section' : 'Save changes'}
        </button>
      </div>
    </form>
  )
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
  const modalTitle = mode === 'create' ? 'Create section' : 'Edit section'
  const initialValues = buildInitialValues(mode, section, typeOptions, defaultOrderIndex)
  const formInstanceKey = `${mode}-${section?.id ?? 'new'}`
  const [isGalleryBulkUploadBusy, setIsGalleryBulkUploadBusy] = useState(false)

  return (
    <ScrollableAdminModal
      isOpen={isOpen}
      title={modalTitle}
      description="All values are persisted directly to Supabase."
      onClose={onClose}
      isCloseDisabled={isSubmitting || isGalleryBulkUploadBusy}
      maxWidthClassName="max-w-6xl"
    >
      <SectionFormFields
        key={formInstanceKey}
        mode={mode}
        typeOptions={typeOptions}
        initialValues={initialValues}
        isSubmitting={isSubmitting}
        isGalleryBulkUploadBusy={isGalleryBulkUploadBusy}
        errorMessage={errorMessage}
        onClose={onClose}
        onGalleryBulkUploadBusyChange={setIsGalleryBulkUploadBusy}
        onSubmit={onSubmit}
      />
    </ScrollableAdminModal>
  )
}
