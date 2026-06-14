import { memo, useCallback, useState } from 'react'
import type { JsonValue } from '@/types/section'

interface ReasonsILoveYouContentEditorProps {
  initialContent: JsonValue
  disabled?: boolean
  onContentChange: (content: JsonValue) => void
}

interface ReasonEditorItem {
  id: string
  text: string
}

interface ReasonsEditorState {
  contentExtras: Record<string, JsonValue>
  title: string
  subtitle: string
  shuffle: boolean
  reasons: ReasonEditorItem[]
}

interface ReasonItemEditorProps {
  item: ReasonEditorItem
  index: number
  totalCount: number
  disabled: boolean
  onMove: (itemId: string, direction: 'up' | 'down') => void
  onRemove: (itemId: string) => void
  onTextChange: (itemId: string, value: string) => void
}

const defaultTitle = 'Reasons I Love Asmaa'
const defaultSubtitle = 'There are more reasons than I can count...'

const buildLocalId = (): string => {
  return `reason-${Math.random().toString(36).slice(2, 10)}`
}

const stringifyContent = (content: JsonValue): string => {
  return JSON.stringify(content, null, 2)
}

const isRecord = (value: JsonValue): value is Record<string, JsonValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getOptionalString = (value: JsonValue | undefined): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const getString = (value: JsonValue | undefined, fallback: string): string => {
  const normalizedValue = getOptionalString(value)
  return normalizedValue.length > 0 ? normalizedValue : fallback
}

const getBoolean = (value: JsonValue | undefined, fallback: boolean): boolean => {
  return typeof value === 'boolean' ? value : fallback
}

const buildEmptyReason = (): ReasonEditorItem => {
  return {
    id: buildLocalId(),
    text: '',
  }
}

const getReasonItems = (reasons: JsonValue[]): ReasonEditorItem[] => {
  return reasons
    .map((rawReason): ReasonEditorItem | null => {
      if (typeof rawReason === 'string') {
        return {
          id: buildLocalId(),
          text: rawReason,
        }
      }

      if (!isRecord(rawReason)) {
        return null
      }

      const text = getOptionalString(rawReason.text) || getOptionalString(rawReason.reason) || getOptionalString(rawReason.title)

      return {
        id: getOptionalString(rawReason.id) || buildLocalId(),
        text,
      }
    })
    .filter((item): item is ReasonEditorItem => item !== null)
}

const buildEditorState = (content: JsonValue): ReasonsEditorState => {
  const baseContent = isRecord(content) ? content : {}
  const contentExtras: Record<string, JsonValue> = { ...baseContent }
  const rawReasons = Array.isArray(baseContent.reasons) ? baseContent.reasons : []
  const reasons = getReasonItems(rawReasons)

  delete contentExtras.title
  delete contentExtras.subtitle
  delete contentExtras.reasons
  delete contentExtras.shuffle

  return {
    contentExtras,
    title: getString(baseContent.title, defaultTitle),
    subtitle: getString(baseContent.subtitle, defaultSubtitle),
    shuffle: getBoolean(baseContent.shuffle, false),
    reasons: reasons.length > 0 ? reasons : [buildEmptyReason()],
  }
}

const toContent = (editorState: ReasonsEditorState): JsonValue => {
  return {
    ...editorState.contentExtras,
    title: editorState.title.trim() || defaultTitle,
    subtitle: editorState.subtitle.trim() || defaultSubtitle,
    reasons: editorState.reasons.map((item) => item.text.trim()).filter(Boolean),
    shuffle: editorState.shuffle,
  }
}

const moveItem = (items: ReasonEditorItem[], index: number, direction: 'up' | 'down'): ReasonEditorItem[] => {
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [movedItem] = nextItems.splice(index, 1)
  nextItems.splice(targetIndex, 0, movedItem)
  return nextItems
}

const moveItemById = (
  items: ReasonEditorItem[],
  itemId: string,
  direction: 'up' | 'down',
): ReasonEditorItem[] => {
  const itemIndex = items.findIndex((item) => item.id === itemId)
  if (itemIndex === -1) {
    return items
  }

  return moveItem(items, itemIndex, direction)
}

const getBulkPasteReasons = (value: string): ReasonEditorItem[] => {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => ({
      id: buildLocalId(),
      text,
    }))
}

const ReasonItemEditorBase = ({
  item,
  index,
  totalCount,
  disabled,
  onMove,
  onRemove,
  onTextChange,
}: ReasonItemEditorProps) => {
  const isFirst = index === 0
  const isLast = index === totalCount - 1

  return (
    <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Reason {index + 1}</p>
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
            disabled={disabled || totalCount <= 1}
          >
            Remove
          </button>
        </div>
      </div>

      <label className="block space-y-1 text-xs">
        <span className="text-zinc-300">Reason text</span>
        <textarea
          value={item.text}
          onChange={(event) => {
            onTextChange(item.id, event.currentTarget.value)
          }}
          className="min-h-20 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
          placeholder="Because you make ordinary days feel magical."
          disabled={disabled}
        />
      </label>
    </div>
  )
}

const ReasonItemEditor = memo(ReasonItemEditorBase)

export const ReasonsILoveYouContentEditor = ({
  initialContent,
  disabled = false,
  onContentChange,
}: ReasonsILoveYouContentEditorProps) => {
  const [editorState, setEditorState] = useState<ReasonsEditorState>(() => buildEditorState(initialContent))
  const [rawContentText, setRawContentText] = useState(() => stringifyContent(toContent(buildEditorState(initialContent))))
  const [rawContentError, setRawContentError] = useState<string | null>(null)
  const [bulkPasteText, setBulkPasteText] = useState('')
  const [bulkPasteError, setBulkPasteError] = useState<string | null>(null)
  const canonicalContentText = stringifyContent(toContent(editorState))

  const commitEditorState = useCallback(
    (nextEditorState: ReasonsEditorState) => {
      const nextContent = toContent(nextEditorState)
      setEditorState(nextEditorState)
      setRawContentText(stringifyContent(nextContent))
      setRawContentError(null)
      onContentChange(nextContent)
    },
    [onContentChange],
  )

  const updateEditorState = useCallback(
    (updater: (previousState: ReasonsEditorState) => ReasonsEditorState) => {
      setEditorState((previousState) => {
        const nextEditorState = updater(previousState)
        const nextContent = toContent(nextEditorState)
        setRawContentText(stringifyContent(nextContent))
        setRawContentError(null)
        onContentChange(nextContent)
        return nextEditorState
      })
    },
    [onContentChange],
  )

  const handleRawContentChange = useCallback(
    (value: string) => {
      setRawContentText(value)

      try {
        const parsedContent = JSON.parse(value) as JsonValue

        if (!isRecord(parsedContent)) {
          setRawContentError('Reasons content should be a JSON object.')
          return
        }

        setRawContentError(null)
        setEditorState(buildEditorState(parsedContent))
        onContentChange(parsedContent)
      } catch {
        setRawContentError('Content must be valid JSON before saving.')
      }
    },
    [onContentChange],
  )

  const handleAddReason = useCallback(() => {
    updateEditorState((previousState) => ({
      ...previousState,
      reasons: [...previousState.reasons, buildEmptyReason()],
    }))
  }, [updateEditorState])

  const handleMoveReason = useCallback(
    (itemId: string, direction: 'up' | 'down') => {
      updateEditorState((previousState) => ({
        ...previousState,
        reasons: moveItemById(previousState.reasons, itemId, direction),
      }))
    },
    [updateEditorState],
  )

  const handleRemoveReason = useCallback(
    (itemId: string) => {
      updateEditorState((previousState) => {
        const nextReasons = previousState.reasons.filter((item) => item.id !== itemId)

        return {
          ...previousState,
          reasons: nextReasons.length > 0 ? nextReasons : [buildEmptyReason()],
        }
      })
    },
    [updateEditorState],
  )

  const handleReasonTextChange = useCallback(
    (itemId: string, value: string) => {
      updateEditorState((previousState) => ({
        ...previousState,
        reasons: previousState.reasons.map((item) => (item.id === itemId ? { ...item, text: value } : item)),
      }))
    },
    [updateEditorState],
  )

  const handleBulkPaste = useCallback(
    (mode: 'append' | 'replace') => {
      const pastedReasons = getBulkPasteReasons(bulkPasteText)

      if (pastedReasons.length === 0) {
        setBulkPasteError('Paste at least one reason, with one reason per line.')
        return
      }

      setBulkPasteError(null)
      updateEditorState((previousState) => ({
        ...previousState,
        reasons: mode === 'append' ? [...previousState.reasons, ...pastedReasons] : pastedReasons,
      }))
      setBulkPasteText('')
    },
    [bulkPasteText, updateEditorState],
  )

  return (
    <div className="space-y-3 rounded-lg border border-zinc-700/80 bg-zinc-950/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Reasons I love you</p>
          <p className="text-xs text-zinc-400">
            Add hidden romantic reasons, reorder them, and optionally reveal them in a shuffled order.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddReason}
          className="rounded-md border border-blue-700 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          Add reason
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-xs">
          <span className="text-zinc-300">Section title</span>
          <input
            type="text"
            value={editorState.title}
            onChange={(event) => {
              commitEditorState({
                ...editorState,
                title: event.currentTarget.value,
              })
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
            placeholder={defaultTitle}
            disabled={disabled}
          />
        </label>

        <label className="block space-y-1 text-xs">
          <span className="text-zinc-300">Subtitle</span>
          <input
            type="text"
            value={editorState.subtitle}
            onChange={(event) => {
              commitEditorState({
                ...editorState,
                subtitle: event.currentTarget.value,
              })
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
            placeholder={defaultSubtitle}
            disabled={disabled}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-300">
        <input
          type="checkbox"
          checked={editorState.shuffle}
          onChange={(event) => {
            commitEditorState({
              ...editorState,
              shuffle: event.currentTarget.checked,
            })
          }}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
          disabled={disabled}
        />
        Shuffle reveal order for the Next button
      </label>

      <div className="space-y-3 rounded-lg border border-blue-900/70 bg-blue-950/20 p-3">
        <div>
          <p className="text-sm font-semibold text-blue-100">Bulk paste reasons</p>
          <p className="mt-1 text-xs text-blue-200/75">Paste one reason per line, then append or replace the current list.</p>
        </div>
        <textarea
          value={bulkPasteText}
          onChange={(event) => {
            setBulkPasteText(event.currentTarget.value)
            setBulkPasteError(null)
          }}
          className="min-h-28 w-full rounded-md border border-blue-900/80 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-blue-700 transition focus:ring-1"
          placeholder={'You always know how to make me smile.\nYour laugh feels like home.'}
          disabled={disabled}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              handleBulkPaste('append')
            }}
            className="rounded-md border border-blue-700 px-3 py-1.5 text-xs font-semibold text-blue-100 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
          >
            Append lines
          </button>
          <button
            type="button"
            onClick={() => {
              handleBulkPaste('replace')
            }}
            className="rounded-md border border-amber-700 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
          >
            Replace reasons
          </button>
        </div>
        {bulkPasteError ? (
          <p className="rounded-md border border-amber-800 bg-amber-900/30 px-3 py-2 text-xs text-amber-300">{bulkPasteError}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        {editorState.reasons.map((item, index) => (
          <ReasonItemEditor
            key={item.id}
            item={item}
            index={index}
            totalCount={editorState.reasons.length}
            disabled={disabled}
            onMove={handleMoveReason}
            onRemove={handleRemoveReason}
            onTextChange={handleReasonTextChange}
          />
        ))}
      </div>

      <label className="block space-y-1.5 text-sm">
        <span className="text-zinc-300">Content (JSON)</span>
        <textarea
          value={rawContentText}
          onChange={(event) => {
            handleRawContentChange(event.currentTarget.value)
          }}
          className="min-h-44 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
          spellCheck={false}
          disabled={disabled}
        />
      </label>
      <input type="hidden" name="content" value={canonicalContentText} />

      {rawContentError ? (
        <p className="rounded-md border border-amber-800 bg-amber-900/30 px-3 py-2 text-xs text-amber-300">{rawContentError}</p>
      ) : null}
    </div>
  )
}
