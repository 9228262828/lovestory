import { useEffect, useMemo, useState } from 'react'
import { UploadField } from '@/features/uploads/components/UploadField'
import type { JsonValue } from '@/types/section'

interface ThreeDGalleryContentEditorProps {
  initialContent: JsonValue
  fallbackImageUrl: string | null
  resetKey: string
  disabled?: boolean
  onContentChange: (content: JsonValue) => void
}

interface GalleryImageItem {
  id: string
  imageUrl: string
  caption: string
}

const buildLocalId = (): string => {
  return `gallery-image-${Math.random().toString(36).slice(2, 10)}`
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
        ...(normalizedCaption ? { caption: normalizedCaption } : {}),
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

export const ThreeDGalleryContentEditor = ({
  initialContent,
  fallbackImageUrl,
  resetKey,
  disabled = false,
  onContentChange,
}: ThreeDGalleryContentEditorProps) => {
  const parsedInitial = useMemo(() => {
    const baseContent = isRecord(initialContent) ? initialContent : {}
    const cards = Array.isArray(baseContent.cards) ? baseContent.cards : []
    const { cards: _ignoredCards, ...contentWithoutCards } = baseContent

    return {
      contentWithoutCards,
      nonImageCards: getNonImageCards(cards),
      imageItems: getImageItemsFromCards(cards, fallbackImageUrl),
    }
  }, [fallbackImageUrl, initialContent, resetKey])

  const [contentWithoutCards, setContentWithoutCards] = useState<Record<string, JsonValue>>(parsedInitial.contentWithoutCards)
  const [nonImageCards, setNonImageCards] = useState<JsonValue[]>(parsedInitial.nonImageCards)
  const [imageItems, setImageItems] = useState<GalleryImageItem[]>(parsedInitial.imageItems)

  useEffect(() => {
    setContentWithoutCards(parsedInitial.contentWithoutCards)
    setNonImageCards(parsedInitial.nonImageCards)
    setImageItems(parsedInitial.imageItems)
  }, [parsedInitial])

  useEffect(() => {
    onContentChange(toGalleryContent(contentWithoutCards, nonImageCards, imageItems))
  }, [contentWithoutCards, imageItems, nonImageCards, onContentChange])

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
          onClick={() => {
            setImageItems((previousItems) => [
              ...previousItems,
              {
                id: buildLocalId(),
                imageUrl: '',
                caption: '',
              },
            ])
          }}
          className="rounded-md border border-blue-700 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          Add image
        </button>
      </div>

      {imageItems.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-700 px-3 py-3 text-xs text-zinc-400">
          No gallery images yet. Add one or more images to build the mobile cover flow.
        </p>
      ) : null}

      <div className="space-y-3">
        {imageItems.map((item, index) => {
          const isFirst = index === 0
          const isLast = index === imageItems.length - 1

          return (
            <div key={item.id} className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950/80 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Image {index + 1}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImageItems((previousItems) => moveItem(previousItems, index, 'up'))
                    }}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={disabled || isFirst}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageItems((previousItems) => moveItem(previousItems, index, 'down'))
                    }}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={disabled || isLast}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageItems((previousItems) => previousItems.filter((existingItem) => existingItem.id !== item.id))
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
                helperText="Upload an image for this gallery slot."
                onValueChange={(value) => {
                  setImageItems((previousItems) =>
                    previousItems.map((existingItem) =>
                      existingItem.id === item.id ? { ...existingItem, imageUrl: value ?? '' } : existingItem,
                    ),
                  )
                }}
              />

              <label className="block space-y-1 text-xs">
                <span className="text-zinc-300">Caption (optional)</span>
                <input
                  type="text"
                  value={item.caption}
                  onChange={(event) => {
                    const nextCaption = event.currentTarget.value
                    setImageItems((previousItems) =>
                      previousItems.map((existingItem) =>
                        existingItem.id === item.id ? { ...existingItem, caption: nextCaption } : existingItem,
                      ),
                    )
                  }}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
                  placeholder="Optional caption"
                  disabled={disabled}
                />
              </label>
            </div>
          )
        })}
      </div>

      {nonImageCards.length > 0 ? (
        <p className="rounded-md border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-[11px] text-zinc-400">
          Existing non-image cards are kept in the content JSON and will render after these images.
        </p>
      ) : null}
    </div>
  )
}
