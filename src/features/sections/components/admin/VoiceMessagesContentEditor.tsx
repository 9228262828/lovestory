import { memo, useCallback, useState } from 'react'
import { UploadField } from '@/features/uploads/components/UploadField'
import type { JsonValue } from '@/types/section'

interface VoiceMessagesContentEditorProps {
  initialContent: JsonValue
  disabled?: boolean
  onContentChange: (content: JsonValue) => void
}

interface VoiceMessageItem {
  id: string
  title: string
  description: string
  audioUrl: string
}

interface VoiceMessagesEditorState {
  contentExtras: Record<string, JsonValue>
  title: string
  subtitle: string
  showParticles: boolean
  enableGlow: boolean
  messages: VoiceMessageItem[]
}

interface VoiceMessageItemEditorProps {
  item: VoiceMessageItem
  index: number
  totalCount: number
  disabled: boolean
  onMove: (itemId: string, direction: 'up' | 'down') => void
  onRemove: (itemId: string) => void
  onTitleChange: (itemId: string, value: string) => void
  onDescriptionChange: (itemId: string, value: string) => void
  onAudioUrlChange: (itemId: string, value: string | null) => void
}

const defaultTitle = 'Voice Messages For Asmaa'
const defaultSubtitle = 'Little pieces of my voice, saved for you.'
const defaultLabels = ['Listen when you miss me', 'Before sleeping', 'When you feel sad']

const buildLocalId = (): string => {
  return `voice-message-${Math.random().toString(36).slice(2, 10)}`
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

const buildEmptyMessage = (index: number): VoiceMessageItem => {
  return {
    id: buildLocalId(),
    title: defaultLabels[index % defaultLabels.length] ?? `Voice message ${index + 1}`,
    description: '',
    audioUrl: '',
  }
}

const getVoiceMessageItems = (messages: JsonValue[]): VoiceMessageItem[] => {
  return messages
    .map((rawMessage, index): VoiceMessageItem | null => {
      if (!isRecord(rawMessage)) {
        return null
      }

      return {
        id: getOptionalString(rawMessage.id) || buildLocalId(),
        title: getString(rawMessage.title, defaultLabels[index % defaultLabels.length] ?? `Voice message ${index + 1}`),
        description: getOptionalString(rawMessage.description),
        audioUrl: getOptionalString(rawMessage.audioUrl),
      }
    })
    .filter((item): item is VoiceMessageItem => item !== null)
}

const buildEditorState = (content: JsonValue): VoiceMessagesEditorState => {
  const baseContent = isRecord(content) ? content : {}
  const contentExtras: Record<string, JsonValue> = { ...baseContent }
  const rawMessages = Array.isArray(baseContent.messages) ? baseContent.messages : []
  const messages = getVoiceMessageItems(rawMessages)

  delete contentExtras.title
  delete contentExtras.subtitle
  delete contentExtras.messages
  delete contentExtras.showParticles
  delete contentExtras.enableGlow

  return {
    contentExtras,
    title: getString(baseContent.title, defaultTitle),
    subtitle: getString(baseContent.subtitle, defaultSubtitle),
    showParticles: getBoolean(baseContent.showParticles, true),
    enableGlow: getBoolean(baseContent.enableGlow, true),
    messages: messages.length > 0 ? messages : [buildEmptyMessage(0)],
  }
}

const toContent = (editorState: VoiceMessagesEditorState): JsonValue => {
  return {
    ...editorState.contentExtras,
    title: editorState.title.trim() || defaultTitle,
    subtitle: editorState.subtitle.trim() || defaultSubtitle,
    messages: editorState.messages.map((item, index) => {
      const normalizedDescription = item.description.trim()

      return {
        id: item.id || `voice-message-${index + 1}`,
        title: item.title.trim() || defaultLabels[index % defaultLabels.length] || `Voice message ${index + 1}`,
        description: normalizedDescription,
        audioUrl: item.audioUrl.trim(),
      }
    }),
    showParticles: editorState.showParticles,
    enableGlow: editorState.enableGlow,
  }
}

const moveItem = (items: VoiceMessageItem[], index: number, direction: 'up' | 'down'): VoiceMessageItem[] => {
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
  items: VoiceMessageItem[],
  itemId: string,
  direction: 'up' | 'down',
): VoiceMessageItem[] => {
  const itemIndex = items.findIndex((item) => item.id === itemId)
  if (itemIndex === -1) {
    return items
  }

  return moveItem(items, itemIndex, direction)
}

const VoiceMessageItemEditorBase = ({
  item,
  index,
  totalCount,
  disabled,
  onMove,
  onRemove,
  onTitleChange,
  onDescriptionChange,
  onAudioUrlChange,
}: VoiceMessageItemEditorProps) => {
  const isFirst = index === 0
  const isLast = index === totalCount - 1

  return (
    <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Voice message {index + 1}</p>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-xs">
          <span className="text-zinc-300">Title</span>
          <input
            type="text"
            value={item.title}
            onChange={(event) => {
              onTitleChange(item.id, event.currentTarget.value)
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
            placeholder={defaultLabels[index % defaultLabels.length] ?? 'Voice message title'}
            disabled={disabled}
          />
        </label>

        <label className="block space-y-1 text-xs">
          <span className="text-zinc-300">Description (optional)</span>
          <input
            type="text"
            value={item.description}
            onChange={(event) => {
              onDescriptionChange(item.id, event.currentTarget.value)
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
            placeholder="Play this whenever you need to hear me."
            disabled={disabled}
          />
        </label>
      </div>

      <UploadField
        key={`${item.id}-${item.audioUrl}`}
        label="Audio file"
        target="voice-note"
        name={`voice_message_audio_${item.id}`}
        defaultValue={item.audioUrl || null}
        disabled={disabled}
        helperText="Upload a voice message audio file."
        variant="compact"
        onValueChange={(value) => {
          onAudioUrlChange(item.id, value)
        }}
      />
    </div>
  )
}

const VoiceMessageItemEditor = memo(VoiceMessageItemEditorBase)

export const VoiceMessagesContentEditor = ({
  initialContent,
  disabled = false,
  onContentChange,
}: VoiceMessagesContentEditorProps) => {
  const [editorState, setEditorState] = useState<VoiceMessagesEditorState>(() => buildEditorState(initialContent))
  const [rawContentText, setRawContentText] = useState(() => stringifyContent(toContent(buildEditorState(initialContent))))
  const [rawContentError, setRawContentError] = useState<string | null>(null)
  const canonicalContentText = stringifyContent(toContent(editorState))

  const commitEditorState = useCallback(
    (nextEditorState: VoiceMessagesEditorState) => {
      const nextContent = toContent(nextEditorState)
      setEditorState(nextEditorState)
      setRawContentText(stringifyContent(nextContent))
      setRawContentError(null)
      onContentChange(nextContent)
    },
    [onContentChange],
  )

  const updateEditorState = useCallback(
    (updater: (previousState: VoiceMessagesEditorState) => VoiceMessagesEditorState) => {
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
          setRawContentError('Voice messages content should be a JSON object.')
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

  const handleAddMessage = useCallback(() => {
    updateEditorState((previousState) => ({
      ...previousState,
      messages: [...previousState.messages, buildEmptyMessage(previousState.messages.length)],
    }))
  }, [updateEditorState])

  const handleMoveMessage = useCallback(
    (itemId: string, direction: 'up' | 'down') => {
      updateEditorState((previousState) => ({
        ...previousState,
        messages: moveItemById(previousState.messages, itemId, direction),
      }))
    },
    [updateEditorState],
  )

  const handleRemoveMessage = useCallback(
    (itemId: string) => {
      updateEditorState((previousState) => {
        const nextMessages = previousState.messages.filter((item) => item.id !== itemId)

        return {
          ...previousState,
          messages: nextMessages.length > 0 ? nextMessages : [buildEmptyMessage(0)],
        }
      })
    },
    [updateEditorState],
  )

  const handleTitleChange = useCallback(
    (value: string) => {
      updateEditorState((previousState) => ({
        ...previousState,
        title: value,
      }))
    },
    [updateEditorState],
  )

  const handleSubtitleChange = useCallback(
    (value: string) => {
      updateEditorState((previousState) => ({
        ...previousState,
        subtitle: value,
      }))
    },
    [updateEditorState],
  )

  const handleMessageTitleChange = useCallback(
    (itemId: string, value: string) => {
      updateEditorState((previousState) => ({
        ...previousState,
        messages: previousState.messages.map((item) => (item.id === itemId ? { ...item, title: value } : item)),
      }))
    },
    [updateEditorState],
  )

  const handleMessageDescriptionChange = useCallback(
    (itemId: string, value: string) => {
      updateEditorState((previousState) => ({
        ...previousState,
        messages: previousState.messages.map((item) => (item.id === itemId ? { ...item, description: value } : item)),
      }))
    },
    [updateEditorState],
  )

  const handleMessageAudioUrlChange = useCallback(
    (itemId: string, value: string | null) => {
      updateEditorState((previousState) => ({
        ...previousState,
        messages: previousState.messages.map((item) => (item.id === itemId ? { ...item, audioUrl: value ?? '' } : item)),
      }))
    },
    [updateEditorState],
  )

  return (
    <div className="space-y-3 rounded-lg border border-zinc-700/80 bg-zinc-950/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Voice messages</p>
          <p className="text-xs text-zinc-400">
            Upload voice notes, add romantic labels, and reorder the cards shown on the public page.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddMessage}
          className="rounded-md border border-blue-700 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          Add voice message
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-xs">
          <span className="text-zinc-300">Section title</span>
          <input
            type="text"
            value={editorState.title}
            onChange={(event) => {
              handleTitleChange(event.currentTarget.value)
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
              handleSubtitleChange(event.currentTarget.value)
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1"
            placeholder={defaultSubtitle}
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
        {editorState.messages.map((item, index) => (
          <VoiceMessageItemEditor
            key={item.id}
            item={item}
            index={index}
            totalCount={editorState.messages.length}
            disabled={disabled}
            onMove={handleMoveMessage}
            onRemove={handleRemoveMessage}
            onTitleChange={handleMessageTitleChange}
            onDescriptionChange={handleMessageDescriptionChange}
            onAudioUrlChange={handleMessageAudioUrlChange}
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
