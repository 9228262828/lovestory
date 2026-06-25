import { useCallback, useMemo, useState } from 'react'
import { ScrollableAdminModal } from '@/components/ui/ScrollableAdminModal'
import { CinematicIntroContentEditor } from '@/features/sections/components/admin/CinematicIntroContentEditor'
import { EmotionalEmergencyKitContentEditor } from '@/features/sections/components/admin/EmotionalEmergencyKitContentEditor'
import { ReasonsILoveYouContentEditor } from '@/features/sections/components/admin/ReasonsILoveYouContentEditor'
import { ThreeDGalleryContentEditor } from '@/features/sections/components/admin/ThreeDGalleryContentEditor'
import { VoiceMessagesContentEditor } from '@/features/sections/components/admin/VoiceMessagesContentEditor'
import { isJsonRecord } from '@/features/sections/utils/sectionDisplayLabel'
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

const getInitialShowLabel = (contentText: string): boolean => {
  const content = parseContent(contentText)

  return isJsonRecord(content) && content.showLabel === true
}

const getInitialDisplayLabel = (contentText: string): string => {
  const content = parseContent(contentText)

  if (!isJsonRecord(content) || typeof content.displayLabel !== 'string') {
    return ''
  }

  return content.displayLabel
}

const mergeDisplayLabelContent = (content: JsonValue, showLabel: boolean, displayLabel: string): JsonValue => {
  if (!isJsonRecord(content)) {
    return content
  }

  const normalizedDisplayLabel = displayLabel.trim()
  const nextContent: Record<string, JsonValue> = {
    ...content,
    showLabel,
  }

  if (normalizedDisplayLabel.length > 0) {
    nextContent.displayLabel = normalizedDisplayLabel
  } else {
    delete nextContent.displayLabel
  }

  return nextContent
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
  const [showLabel, setShowLabel] = useState(() => getInitialShowLabel(initialValues.contentText))
  const [displayLabel, setDisplayLabel] = useState(() => getInitialDisplayLabel(initialValues.contentText))
  const [galleryContent, setGalleryContent] = useState<JsonValue>(() => parseContent(initialValues.contentText))
  const [cinematicIntroContent, setCinematicIntroContent] = useState<JsonValue>(() => parseContent(initialValues.contentText))
  const [voiceMessagesContent, setVoiceMessagesContent] = useState<JsonValue>(() => parseContent(initialValues.contentText))
  const [reasonsLoveContent, setReasonsLoveContent] = useState<JsonValue>(() => parseContent(initialValues.contentText))
  const [emotionalKitContent, setEmotionalKitContent] = useState<JsonValue>(() => parseContent(initialValues.contentText))
  const galleryContentText = useMemo(() => stringifyContent(galleryContent), [galleryContent])
  const availableTypeOptions = useMemo(() => {
    const initialType = initialValues.type.trim()
    const options = initialType.length > 0 ? [...typeOptions, initialType] : typeOptions
    return Array.from(new Set(options)).sort((left, right) => left.localeCompare(right))
  }, [initialValues.type, typeOptions])
  const isThreeDGalleryType = selectedType.trim() === '3d-gallery'
  const isCinematicIntroType = selectedType.trim() === 'cinematic-intro'
  const isVoiceMessagesType = selectedType.trim() === 'voice-messages'
  const isReasonsLoveType = selectedType.trim() === 'reasons-i-love-you'
  const isEmotionalKitType = selectedType.trim() === 'emotional-emergency-kit'
  const isFormBusy = isSubmitting || isGalleryBulkUploadBusy
  const hasSelectedType = selectedType.trim().length > 0

  const handleTypeChange = useCallback(
    (nextType: string) => {
      const previousType = selectedType.trim()
      const normalizedType = nextType.trim()
      const currentContent =
        previousType === '3d-gallery'
          ? galleryContent
          : previousType === 'cinematic-intro'
            ? cinematicIntroContent
            : previousType === 'voice-messages'
              ? voiceMessagesContent
              : previousType === 'reasons-i-love-you'
                ? reasonsLoveContent
                : previousType === 'emotional-emergency-kit'
                  ? emotionalKitContent
                  : parseContent(contentText)

      if (normalizedType === '3d-gallery') {
        setGalleryContent(currentContent)
      } else if (normalizedType === 'cinematic-intro') {
        setCinematicIntroContent(currentContent)
      } else if (normalizedType === 'voice-messages') {
        setVoiceMessagesContent(currentContent)
      } else if (normalizedType === 'reasons-i-love-you') {
        setReasonsLoveContent(currentContent)
      } else if (normalizedType === 'emotional-emergency-kit') {
        setEmotionalKitContent(currentContent)
      }

      if (
        normalizedType !== '3d-gallery' &&
        normalizedType !== 'cinematic-intro' &&
        normalizedType !== 'voice-messages' &&
        normalizedType !== 'reasons-i-love-you' &&
        normalizedType !== 'emotional-emergency-kit'
      ) {
        setContentText(stringifyContent(currentContent))
      }

      setSelectedType(nextType)
    },
    [cinematicIntroContent, contentText, emotionalKitContent, galleryContent, reasonsLoveContent, selectedType, voiceMessagesContent],
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
        if (normalizedType === '3d-gallery') {
          parsedContent = galleryContent
        } else if (normalizedType === 'cinematic-intro') {
          parsedContent = cinematicIntroContent
        } else if (normalizedType === 'voice-messages') {
          parsedContent = voiceMessagesContent
        } else if (normalizedType === 'reasons-i-love-you') {
          parsedContent = reasonsLoveContent
        } else if (normalizedType === 'emotional-emergency-kit') {
          parsedContent = emotionalKitContent
        } else {
          try {
            const nextContentText = formData.get('content')?.toString() ?? ''
            parsedContent = JSON.parse(nextContentText) as JsonValue
          } catch {
            setValidationErrorMessage('Content must be valid JSON.')
            return
          }
        }

        if (!isJsonRecord(parsedContent) && (showLabel || displayLabel.trim().length > 0)) {
          setValidationErrorMessage('Content must be a JSON object to save public label settings.')
          return
        }

        parsedContent = mergeDisplayLabelContent(parsedContent, showLabel, displayLabel)

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
              className={`w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none ring-zinc-500 transition [color-scheme:dark] focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                hasSelectedType ? 'text-zinc-100' : 'text-zinc-400'
              }`}
              required
              disabled={isFormBusy}
            >
              <option value="" disabled className="bg-zinc-950 text-zinc-400">
                Select section type
              </option>
              {availableTypeOptions.map((option) => (
                <option key={option} value={option} className="bg-zinc-950 text-zinc-100">
                  {option}
                </option>
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

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Public display label</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Hidden by default. When enabled, the public site shows this label instead of any technical section type.
              </p>
            </div>

            <label className="flex shrink-0 items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={showLabel}
                onChange={(event) => {
                  setShowLabel(event.currentTarget.checked)
                }}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
                disabled={isFormBusy}
              />
              Show label
            </label>
          </div>

          <label className="mt-4 block space-y-1.5 text-sm">
            <span className="text-zinc-300">Display label text</span>
            <input
              type="text"
              value={displayLabel}
              onChange={(event) => {
                setDisplayLabel(event.currentTarget.value)
              }}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
              placeholder="Example: A letter from Ahmed"
              disabled={isFormBusy}
            />
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
        ) : isCinematicIntroType ? (
          <CinematicIntroContentEditor
            initialContent={cinematicIntroContent}
            disabled={isFormBusy}
            onContentChange={setCinematicIntroContent}
          />
        ) : isVoiceMessagesType ? (
          <VoiceMessagesContentEditor
            initialContent={voiceMessagesContent}
            disabled={isFormBusy}
            onContentChange={setVoiceMessagesContent}
          />
        ) : isReasonsLoveType ? (
          <ReasonsILoveYouContentEditor
            initialContent={reasonsLoveContent}
            disabled={isFormBusy}
            onContentChange={setReasonsLoveContent}
          />
        ) : isEmotionalKitType ? (
          <EmotionalEmergencyKitContentEditor
            initialContent={emotionalKitContent}
            disabled={isFormBusy}
            onContentChange={setEmotionalKitContent}
          />
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
  const initialValues = buildInitialValues(mode, section, defaultOrderIndex)
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
