import { memo, useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { getUploadTargetConfig } from '@/features/uploads/config/uploadTargets'
import { UploadField } from '@/features/uploads/components/UploadField'
import { storageService } from '@/services/supabase/storage.service'
import type { JsonValue } from '@/types/section'

interface ThreeDGalleryContentEditorProps {
  initialContent: JsonValue
  fallbackImageUrl: string | null
  disabled?: boolean
  onContentChange: (content: JsonValue) => void
  onBulkUploadBusyChange?: (isBusy: boolean) => void
}

interface GalleryImageItem {
  id: string
  imageUrl: string
  caption: string
}

interface InitialEditorState {
  contentWithoutCards: Record<string, JsonValue>
  nonImageCards: JsonValue[]
  imageItems: GalleryImageItem[]
}

interface BulkUploadState {
  isUploading: boolean
  totalCount: number
  uploadedCount: number
  failedCount: number
  currentFileName: string
  currentFileProgress: number
  errorMessages: string[]
}

interface GalleryImageItemEditorProps {
  item: GalleryImageItem
  index: number
  totalCount: number
  disabled: boolean
  onMove: (itemId: string, direction: 'up' | 'down') => void
  onRemove: (itemId: string) => void
  onImageUrlChange: (itemId: string, value: string | null) => void
  onCaptionChange: (itemId: string, value: string) => void
}

const imageUploadConfig = getUploadTargetConfig('image')
const bulkUploadProgressStep = 5
const maxBulkUploadErrorMessages = 5

const initialBulkUploadState: BulkUploadState = {
  isUploading: false,
  totalCount: 0,
  uploadedCount: 0,
  failedCount: 0,
  currentFileName: '',
  currentFileProgress: 0,
  errorMessages: [],
}

const buildLocalId = (): string => {
  return `gallery-image-${Math.random().toString(36).slice(2, 10)}`
}

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unable to upload file.'
}

const appendLimitedErrorMessage = (messages: string[], nextMessage: string): string[] => {
  if (messages.length >= maxBulkUploadErrorMessages) {
    return messages
  }

  return [...messages, nextMessage]
}

const isRecord = (value: JsonValue): value is Record<string, JsonValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getOptionalString = (value: JsonValue | undefined): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const getImageItemsFromCards = (cards: JsonValue[], fallbackImageUrl: string | null): GalleryImageItem[] => {
  const imageItems = cards
    .map((rawCard): GalleryImageItem | null => {
      if (!isRecord(rawCard) || rawCard.type !== 'image') {
        return null
      }

      const imageUrl = getOptionalString(rawCard.imageUrl)
      if (imageUrl.length === 0) {
        return null
      }

      return {
        id: getOptionalString(rawCard.id) || buildLocalId(),
        imageUrl,
        caption: getOptionalString(rawCard.caption),
      }
    })
    .filter((item): item is GalleryImageItem => item !== null)

  if (imageItems.length === 0 && fallbackImageUrl && fallbackImageUrl.trim().length > 0) {
    return [
      {
        id: buildLocalId(),
        imageUrl: fallbackImageUrl.trim(),
        caption: '',
      },
    ]
  }

  return imageItems
}

const getNonImageCards = (cards: JsonValue[]): JsonValue[] => {
  return cards.filter((rawCard) => {
    return !isRecord(rawCard) || rawCard.type !== 'image'
  })
}

const toGalleryContent = (
  baseContent: Record<string, JsonValue>,
  nonImageCards: JsonValue[],
  imageItems: GalleryImageItem[],
): JsonValue => {
  const imageCards: JsonValue[] = imageItems
    .filter((item) => item.imageUrl.trim().length > 0)
    .map((item, index) => {
      const normalizedCaption = item.caption.trim()

      return {
        id: item.id || `image-${index + 1}`,
        type: 'image',
        imageUrl: item.imageUrl.trim(),
        caption: normalizedCaption,
      }
    })

  return {
    ...baseContent,
    cards: [...imageCards, ...nonImageCards],
  }
}

const moveItem = (items: GalleryImageItem[], index: number, direction: 'up' | 'down'): GalleryImageItem[] => {
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [moved] = nextItems.splice(index, 1)
  nextItems.splice(targetIndex, 0, moved)
  return nextItems
}

const moveItemById = (
  items: GalleryImageItem[],
  itemId: string,
  direction: 'up' | 'down',
): GalleryImageItem[] => {
  const itemIndex = items.findIndex((item) => item.id === itemId)
  if (itemIndex === -1) {
    return items
  }

  return moveItem(items, itemIndex, direction)
}

const buildInitialEditorState = (initialContent: JsonValue, fallbackImageUrl: string | null): InitialEditorState => {
  const baseContent = isRecord(initialContent) ? initialContent : {}
  const cards = Array.isArray(baseContent.cards) ? baseContent.cards : []
  const contentWithoutCards: Record<string, JsonValue> = { ...baseContent }
  delete contentWithoutCards.cards

  return {
    contentWithoutCards,
    nonImageCards: getNonImageCards(cards),
    imageItems: getImageItemsFromCards(cards, fallbackImageUrl),
  }
}

const GalleryImageItemEditorBase = ({
  item,
  index,
  totalCount,
  disabled,
  onMove,
  onRemove,
  onImageUrlChange,
  onCaptionChange,
}: GalleryImageItemEditorProps) => {
  const isFirst = index === 0
  const isLast = index === totalCount - 1

  return (
    <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Image {index + 1}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              onMove(item.id, 'up')
            }}
            className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || isFirst}
          >
            Up
          </button>
          <button
            type="button"
            onClick={() => {
              onMove(item.id, 'down')
            }}
            className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || isLast}
          >
            Down
          </button>
          <button
            type="button"
            onClick={() => {
              onRemove(item.id)
            }}
            className="rounded-md border border-red-800 px-2 py-1 text-[11px] font-semibold text-red-300 hover:border-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      </div>

      <UploadField
        label="Image file"
        target="image"
        name={`gallery_image_${item.id}`}
        defaultValue={item.imageUrl || null}
        disabled={disabled}
        helperText="Upload or replace this gallery image."
        variant="compact"
        onValueChange={(value) => {
          onImageUrlChange(item.id, value)
        }}
      />

      <label className="block space-y-1 text-xs">
        <span className="text-zinc-300">Caption (optional)</span>
        <input
          type="text"
          value={item.caption}
          onChange={(event) => {
            onCaptionChange(item.id, event.currentTarget.value)
          }}
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
          placeholder="Optional caption"
          disabled={disabled}
        />
      </label>
    </div>
  )
}

const GalleryImageItemEditor = memo(GalleryImageItemEditorBase)

export const ThreeDGalleryContentEditor = ({
  initialContent,
  fallbackImageUrl,
  disabled = false,
  onContentChange,
  onBulkUploadBusyChange,
}: ThreeDGalleryContentEditorProps) => {
  const bulkInputId = useId()
  const bulkFileInputRef = useRef<HTMLInputElement | null>(null)
  const [initialEditorState] = useState<InitialEditorState>(() => {
    return buildInitialEditorState(initialContent, fallbackImageUrl)
  })
  const [imageItems, setImageItems] = useState<GalleryImageItem[]>(initialEditorState.imageItems)
  const [bulkUploadState, setBulkUploadState] = useState<BulkUploadState>(initialBulkUploadState)
  const isBulkUploading = bulkUploadState.isUploading
  const isEditorDisabled = disabled || isBulkUploading
  const processedBulkUploadCount = bulkUploadState.uploadedCount + bulkUploadState.failedCount
  const bulkUploadCompletionPercent =
    bulkUploadState.totalCount > 0 ? Math.round((processedBulkUploadCount / bulkUploadState.totalCount) * 100) : 0

  useEffect(() => {
    onContentChange(toGalleryContent(initialEditorState.contentWithoutCards, initialEditorState.nonImageCards, imageItems))
  }, [imageItems, initialEditorState, onContentChange])

  const handleAddImage = useCallback(() => {
    setImageItems((previousItems) => [
      ...previousItems,
      {
        id: buildLocalId(),
        imageUrl: '',
        caption: '',
      },
    ])
  }, [])

  const handleMoveImage = useCallback((itemId: string, direction: 'up' | 'down') => {
    setImageItems((previousItems) => moveItemById(previousItems, itemId, direction))
  }, [])

  const handleRemoveImage = useCallback((itemId: string) => {
    setImageItems((previousItems) => previousItems.filter((existingItem) => existingItem.id !== itemId))
  }, [])

  const handleImageUrlChange = useCallback((itemId: string, value: string | null) => {
    setImageItems((previousItems) =>
      previousItems.map((existingItem) =>
        existingItem.id === itemId ? { ...existingItem, imageUrl: value ?? '' } : existingItem,
      ),
    )
  }, [])

  const handleCaptionChange = useCallback((itemId: string, value: string) => {
    setImageItems((previousItems) =>
      previousItems.map((existingItem) =>
        existingItem.id === itemId ? { ...existingItem, caption: value } : existingItem,
      ),
    )
  }, [])

  const handleBulkUploadFiles = useCallback(
    async (files: File[]) => {
      if (disabled || isBulkUploading || files.length === 0) {
        return
      }

      let uploadedCount = 0
      let failedCount = 0
      let errorMessages: string[] = []

      onBulkUploadBusyChange?.(true)
      setBulkUploadState({
        isUploading: true,
        totalCount: files.length,
        uploadedCount,
        failedCount,
        currentFileName: '',
        currentFileProgress: 0,
        errorMessages,
      })

      try {
        for (const file of files) {
          let lastReportedProgress = 0

          setBulkUploadState((previousState) => ({
            ...previousState,
            currentFileName: file.name,
            currentFileProgress: 0,
          }))

          const validation = storageService.validateFile('image', file)
          if (!validation.isValid) {
            failedCount += 1
            errorMessages = appendLimitedErrorMessage(
              errorMessages,
              `${file.name}: ${validation.errorMessage ?? 'Selected file is not valid for upload.'}`,
            )
            setBulkUploadState((previousState) => ({
              ...previousState,
              failedCount,
              currentFileProgress: 0,
              errorMessages,
            }))
            continue
          }

          try {
            const uploaded = await storageService.uploadFile({
              target: 'image',
              file,
              namespace: 'sections',
              onProgress: (progress) => {
                if (progress !== 100 && progress - lastReportedProgress < bulkUploadProgressStep) {
                  return
                }

                lastReportedProgress = progress
                setBulkUploadState((previousState) => ({
                  ...previousState,
                  currentFileProgress: progress,
                }))
              },
            })

            uploadedCount += 1
            setImageItems((previousItems) => [
              ...previousItems,
              {
                id: buildLocalId(),
                imageUrl: uploaded.publicUrl,
                caption: '',
              },
            ])
            setBulkUploadState((previousState) => ({
              ...previousState,
              uploadedCount,
              currentFileProgress: 100,
            }))
          } catch (error) {
            failedCount += 1
            errorMessages = appendLimitedErrorMessage(errorMessages, `${file.name}: ${getErrorMessage(error)}`)
            setBulkUploadState((previousState) => ({
              ...previousState,
              failedCount,
              currentFileProgress: 0,
              errorMessages,
            }))
          }
        }
      } finally {
        setBulkUploadState((previousState) => ({
          ...previousState,
          isUploading: false,
          currentFileName: '',
          currentFileProgress: 0,
        }))
        onBulkUploadBusyChange?.(false)
      }
    },
    [disabled, isBulkUploading, onBulkUploadBusyChange],
  )

  const handleBulkUploadInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.currentTarget.files ?? [])
      event.currentTarget.value = ''
      void handleBulkUploadFiles(selectedFiles)
    },
    [handleBulkUploadFiles],
  )

  const handleBulkUploadClick = useCallback(() => {
    if (isEditorDisabled) {
      return
    }

    bulkFileInputRef.current?.click()
  }, [isEditorDisabled])

  return (
    <div className="space-y-3 rounded-lg border border-zinc-700/80 bg-zinc-950/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Gallery images</p>
          <p className="text-xs text-zinc-400">
            Upload multiple images, add optional captions, and reorder with Up/Down.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddImage}
          className="rounded-md border border-blue-700 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isEditorDisabled}
        >
          Add image
        </button>
      </div>

      <div className="space-y-3 rounded-lg border border-blue-900/70 bg-blue-950/20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <label htmlFor={bulkInputId} className="text-sm font-semibold text-blue-100">
              Bulk Upload Images
            </label>
            <p className="mt-1 text-xs text-blue-200/75">
              Select many images at once. Uploads run one at a time and each success adds a gallery card.
            </p>
          </div>
          <button
            type="button"
            onClick={handleBulkUploadClick}
            className="rounded-md border border-blue-600 bg-blue-700/70 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isEditorDisabled}
          >
            {isBulkUploading ? 'Uploading...' : 'Select images'}
          </button>
        </div>

        <input
          id={bulkInputId}
          ref={bulkFileInputRef}
          type="file"
          accept={imageUploadConfig.inputAccept}
          multiple
          onChange={handleBulkUploadInputChange}
          className="sr-only"
          disabled={isEditorDisabled}
        />

        <p className="text-[11px] text-blue-200/70">
          Supported: {imageUploadConfig.inputAccept} - Max {Math.round(imageUploadConfig.maxSizeBytes / 1024 / 1024)}MB per image
        </p>

        {bulkUploadState.totalCount > 0 ? (
          <div className="space-y-2 rounded-md border border-blue-900/70 bg-zinc-950/70 p-3">
            <div className="grid gap-2 text-xs text-zinc-300 sm:grid-cols-4">
              <span>Total files: {bulkUploadState.totalCount}</span>
              <span>Uploaded: {bulkUploadState.uploadedCount}</span>
              <span>Failed: {bulkUploadState.failedCount}</span>
              <span>Current: {bulkUploadState.currentFileName || 'None'}</span>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-[width]"
                  style={{ width: `${bulkUploadCompletionPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-blue-200">
                Processed {processedBulkUploadCount} of {bulkUploadState.totalCount}
              </p>
            </div>
            {isBulkUploading && bulkUploadState.currentFileName ? (
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-[width]"
                    style={{ width: `${bulkUploadState.currentFileProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-cyan-200">
                  Current file progress: {bulkUploadState.currentFileProgress}%
                </p>
              </div>
            ) : null}
            {bulkUploadState.errorMessages.length > 0 ? (
              <div className="space-y-1 rounded-md border border-red-900/70 bg-red-950/20 px-2.5 py-2 text-[11px] text-red-200">
                {bulkUploadState.errorMessages.map((message) => (
                  <p key={message}>{message}</p>
                ))}
                {bulkUploadState.failedCount > bulkUploadState.errorMessages.length ? (
                  <p>Showing first {bulkUploadState.errorMessages.length} upload errors.</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {imageItems.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-700 px-3 py-3 text-xs text-zinc-400">
          No gallery images yet. Add one or more images to build the mobile cover flow.
        </p>
      ) : null}

      <div className="space-y-3">
        {imageItems.map((item, index) => (
          <GalleryImageItemEditor
            key={item.id}
            item={item}
            index={index}
            totalCount={imageItems.length}
            disabled={isEditorDisabled}
            onMove={handleMoveImage}
            onRemove={handleRemoveImage}
            onImageUrlChange={handleImageUrlChange}
            onCaptionChange={handleCaptionChange}
          />
        ))}
      </div>

      {initialEditorState.nonImageCards.length > 0 ? (
        <p className="rounded-md border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-[11px] text-zinc-400">
          Existing non-image cards are kept in the content JSON and will render after these images.
        </p>
      ) : null}
    </div>
  )
}
