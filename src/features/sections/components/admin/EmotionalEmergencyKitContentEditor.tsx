import { memo, useCallback, useState } from 'react'
import {
  defaultEmotionalEmergencyKitContent,
  defaultEmotionalEmergencyKitDoses,
  defaultEmotionalEmergencyKitSubtitle,
  defaultEmotionalEmergencyKitTitle,
  type EmotionalDose,
} from '@/features/sections/components/sections/emotionalEmergencyKit/content'
import type { JsonValue } from '@/types/section'

interface EmotionalEmergencyKitContentEditorProps {
  initialContent: JsonValue
  disabled?: boolean
  onContentChange: (content: JsonValue) => void
}

interface DoseEditorItem {
  id: string
  title: string
  emoji: string
  message: string
}

interface EmotionalEmergencyKitEditorState {
  contentExtras: Record<string, JsonValue>
  title: string
  subtitle: string
  showParticles: boolean
  enableGlow: boolean
  doses: DoseEditorItem[]
}

interface DoseItemEditorProps {
  item: DoseEditorItem
  index: number
  totalCount: number
  disabled: boolean
  onMove: (itemId: string, direction: 'up' | 'down') => void
  onRemove: (itemId: string) => void
  onTitleChange: (itemId: string, value: string) => void
  onEmojiChange: (itemId: string, value: string) => void
  onMessageChange: (itemId: string, value: string) => void
}

const stringifyContent = (content: JsonValue): string => {
  return JSON.stringify(content, null, 2)
}

const buildLocalId = (): string => {
  return `emotional-dose-${Math.random().toString(36).slice(2, 10)}`
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

const toDoseEditorItem = (dose: EmotionalDose): DoseEditorItem => {
  return {
    id: dose.id || buildLocalId(),
    title: dose.title,
    emoji: dose.emoji,
    message: dose.message,
  }
}

const buildEmptyDose = (index: number): DoseEditorItem => {
  return {
    id: buildLocalId(),
    title: `جرعة حب ${index + 1}`,
    emoji: '💊',
    message: '',
  }
}

const getDoseItems = (doses: JsonValue[]): DoseEditorItem[] => {
  return doses
    .map((rawDose, index): DoseEditorItem | null => {
      if (!isRecord(rawDose)) {
        return null
      }

      const title = getOptionalString(rawDose.title)
      const message = getOptionalString(rawDose.message)

      if (title.length === 0 && message.length === 0) {
        return null
      }

      return {
        id: getOptionalString(rawDose.id) || buildLocalId(),
        title: title || `جرعة حب ${index + 1}`,
        emoji: getString(rawDose.emoji, '💊'),
        message,
      }
    })
    .filter((item): item is DoseEditorItem => item !== null)
}

const buildEditorState = (content: JsonValue): EmotionalEmergencyKitEditorState => {
  const baseContent = isRecord(content) ? content : {}
  const contentExtras: Record<string, JsonValue> = { ...baseContent }
  const rawDoses = Array.isArray(baseContent.doses) ? baseContent.doses : []
  const doses = getDoseItems(rawDoses)

  delete contentExtras.title
  delete contentExtras.subtitle
  delete contentExtras.doses
  delete contentExtras.showParticles
  delete contentExtras.enableGlow

  return {
    contentExtras,
    title: getString(baseContent.title, defaultEmotionalEmergencyKitTitle),
    subtitle: getString(baseContent.subtitle, defaultEmotionalEmergencyKitSubtitle),
    showParticles: getBoolean(baseContent.showParticles, defaultEmotionalEmergencyKitContent.showParticles),
    enableGlow: getBoolean(baseContent.enableGlow, defaultEmotionalEmergencyKitContent.enableGlow),
    doses:
      doses.length > 0
        ? doses
        : defaultEmotionalEmergencyKitDoses.map((dose) => toDoseEditorItem(dose)),
  }
}

const toContent = (editorState: EmotionalEmergencyKitEditorState): JsonValue => {
  return {
    ...editorState.contentExtras,
    title: editorState.title.trim() || defaultEmotionalEmergencyKitTitle,
    subtitle: editorState.subtitle.trim() || defaultEmotionalEmergencyKitSubtitle,
    doses: editorState.doses.map((item, index) => ({
      id: item.id || `emotional-dose-${index + 1}`,
      title: item.title.trim() || `جرعة حب ${index + 1}`,
      emoji: item.emoji.trim() || '💊',
      message: item.message.trim(),
    })),
    showParticles: editorState.showParticles,
    enableGlow: editorState.enableGlow,
  }
}

const moveItem = (items: DoseEditorItem[], index: number, direction: 'up' | 'down'): DoseEditorItem[] => {
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [movedItem] = nextItems.splice(index, 1)
  nextItems.splice(targetIndex, 0, movedItem)
  return nextItems
}

const moveItemById = (items: DoseEditorItem[], itemId: string, direction: 'up' | 'down'): DoseEditorItem[] => {
  const itemIndex = items.findIndex((item) => item.id === itemId)
  if (itemIndex === -1) {
    return items
  }

  return moveItem(items, itemIndex, direction)
}

const DoseItemEditorBase = ({
  item,
  index,
  totalCount,
  disabled,
  onMove,
  onRemove,
  onTitleChange,
  onEmojiChange,
  onMessageChange,
}: DoseItemEditorProps) => {
  const isFirst = index === 0
  const isLast = index === totalCount - 1

  return (
    <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Dose {index + 1}</p>
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

      <div className="grid gap-3 sm:grid-cols-[1fr_5rem]">
        <label className="block space-y-1 text-xs">
          <span className="text-zinc-300">Dose title</span>
          <input
            type="text"
            dir="rtl"
            value={item.title}
            onChange={(event) => {
              onTitleChange(item.id, event.currentTarget.value)
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
            placeholder="جرعة ضد الزعل"
            disabled={disabled}
          />
        </label>

        <label className="block space-y-1 text-xs">
          <span className="text-zinc-300">Emoji</span>
          <input
            type="text"
            value={item.emoji}
            onChange={(event) => {
              onEmojiChange(item.id, event.currentTarget.value)
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-center text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
            placeholder="💊"
            disabled={disabled}
          />
        </label>
      </div>

      <label className="block space-y-1 text-xs">
        <span className="text-zinc-300">Prescription message</span>
        <textarea
          dir="rtl"
          value={item.message}
          onChange={(event) => {
            onMessageChange(item.id, event.currentTarget.value)
          }}
          className="min-h-28 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
          placeholder="اكتبي رسالة الجرعة هنا..."
          disabled={disabled}
        />
      </label>
    </div>
  )
}

const DoseItemEditor = memo(DoseItemEditorBase)

export const EmotionalEmergencyKitContentEditor = ({
  initialContent,
  disabled = false,
  onContentChange,
}: EmotionalEmergencyKitContentEditorProps) => {
  const [editorState, setEditorState] = useState<EmotionalEmergencyKitEditorState>(() => buildEditorState(initialContent))
  const [rawContentText, setRawContentText] = useState(() => stringifyContent(toContent(buildEditorState(initialContent))))
  const [rawContentError, setRawContentError] = useState<string | null>(null)
  const canonicalContentText = stringifyContent(toContent(editorState))

  const commitEditorState = useCallback(
    (nextEditorState: EmotionalEmergencyKitEditorState) => {
      const nextContent = toContent(nextEditorState)
      setEditorState(nextEditorState)
      setRawContentText(stringifyContent(nextContent))
      setRawContentError(null)
      onContentChange(nextContent)
    },
    [onContentChange],
  )

  const updateEditorState = useCallback(
    (updater: (previousState: EmotionalEmergencyKitEditorState) => EmotionalEmergencyKitEditorState) => {
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
          setRawContentError('Emergency kit content should be a JSON object.')
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

  const handleAddDose = useCallback(() => {
    updateEditorState((previousState) => ({
      ...previousState,
      doses: [...previousState.doses, buildEmptyDose(previousState.doses.length)],
    }))
  }, [updateEditorState])

  const handleMoveDose = useCallback(
    (itemId: string, direction: 'up' | 'down') => {
      updateEditorState((previousState) => ({
        ...previousState,
        doses: moveItemById(previousState.doses, itemId, direction),
      }))
    },
    [updateEditorState],
  )

  const handleRemoveDose = useCallback(
    (itemId: string) => {
      updateEditorState((previousState) => {
        const nextDoses = previousState.doses.filter((item) => item.id !== itemId)

        return {
          ...previousState,
          doses: nextDoses.length > 0 ? nextDoses : [buildEmptyDose(0)],
        }
      })
    },
    [updateEditorState],
  )

  const handleDoseTitleChange = useCallback(
    (itemId: string, value: string) => {
      updateEditorState((previousState) => ({
        ...previousState,
        doses: previousState.doses.map((item) => (item.id === itemId ? { ...item, title: value } : item)),
      }))
    },
    [updateEditorState],
  )

  const handleDoseEmojiChange = useCallback(
    (itemId: string, value: string) => {
      updateEditorState((previousState) => ({
        ...previousState,
        doses: previousState.doses.map((item) => (item.id === itemId ? { ...item, emoji: value } : item)),
      }))
    },
    [updateEditorState],
  )

  const handleDoseMessageChange = useCallback(
    (itemId: string, value: string) => {
      updateEditorState((previousState) => ({
        ...previousState,
        doses: previousState.doses.map((item) => (item.id === itemId ? { ...item, message: value } : item)),
      }))
    },
    [updateEditorState],
  )

  return (
    <div className="space-y-3 rounded-lg border border-zinc-700/80 bg-zinc-950/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Emotional emergency kit</p>
          <p className="text-xs text-zinc-400">
            Build Arabic romantic medicine cards with cute prescription messages.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddDose}
          className="rounded-md border border-blue-700 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          Add dose
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-xs">
          <span className="text-zinc-300">Section title</span>
          <input
            type="text"
            dir="rtl"
            value={editorState.title}
            onChange={(event) => {
              commitEditorState({
                ...editorState,
                title: event.currentTarget.value,
              })
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
            placeholder={defaultEmotionalEmergencyKitTitle}
            disabled={disabled}
          />
        </label>

        <label className="block space-y-1 text-xs">
          <span className="text-zinc-300">Subtitle</span>
          <input
            type="text"
            dir="rtl"
            value={editorState.subtitle}
            onChange={(event) => {
              commitEditorState({
                ...editorState,
                subtitle: event.currentTarget.value,
              })
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
            placeholder={defaultEmotionalEmergencyKitSubtitle}
            disabled={disabled}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-4 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2">
        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={editorState.showParticles}
            onChange={(event) => {
              commitEditorState({
                ...editorState,
                showParticles: event.currentTarget.checked,
              })
            }}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
            disabled={disabled}
          />
          Show particles
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={editorState.enableGlow}
            onChange={(event) => {
              commitEditorState({
                ...editorState,
                enableGlow: event.currentTarget.checked,
              })
            }}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
            disabled={disabled}
          />
          Enable glow
        </label>
      </div>

      <div className="space-y-3">
        {editorState.doses.map((item, index) => (
          <DoseItemEditor
            key={item.id}
            item={item}
            index={index}
            totalCount={editorState.doses.length}
            disabled={disabled}
            onMove={handleMoveDose}
            onRemove={handleRemoveDose}
            onTitleChange={handleDoseTitleChange}
            onEmojiChange={handleDoseEmojiChange}
            onMessageChange={handleDoseMessageChange}
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
