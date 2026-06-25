import { useCallback, useMemo, useState } from 'react'
import {
  resolveCinematicIntroContentFromRawContent,
  type CinematicIntroContent,
} from '@/features/sections/components/sections/cinematic/content'
import { isJsonRecord } from '@/features/sections/utils/sectionDisplayLabel'
import { UploadField } from '@/features/uploads/components/UploadField'
import type { JsonValue } from '@/types/section'

interface CinematicIntroContentEditorProps {
  initialContent: JsonValue
  disabled?: boolean
  onContentChange: (content: JsonValue) => void
}

const getInitialContentRecord = (initialContent: JsonValue): Record<string, JsonValue> => {
  return isJsonRecord(initialContent) ? { ...initialContent } : {}
}

const getEditorStringValue = (content: Record<string, JsonValue>, key: keyof CinematicIntroContent, fallback: string): string => {
  const value = content[key]

  return typeof value === 'string' ? value : fallback
}

const numberInputClassName =
  'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60'

const textInputClassName =
  'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60'

const checkboxClassName = 'h-4 w-4 rounded border-zinc-600 bg-zinc-950 disabled:cursor-not-allowed disabled:opacity-60'

export const CinematicIntroContentEditor = ({
  initialContent,
  disabled = false,
  onContentChange,
}: CinematicIntroContentEditorProps) => {
  const [editorContent, setEditorContent] = useState<Record<string, JsonValue>>(() => getInitialContentRecord(initialContent))
  const resolvedContent = useMemo<CinematicIntroContent>(
    () => resolveCinematicIntroContentFromRawContent(editorContent),
    [editorContent],
  )

  const updateContent = useCallback(
    (updater: (previousContent: Record<string, JsonValue>) => Record<string, JsonValue>) => {
      setEditorContent((previousContent) => {
        const nextContent = updater(previousContent)
        onContentChange(nextContent)
        return nextContent
      })
    },
    [onContentChange],
  )

  const updateString = useCallback(
    (key: keyof Pick<CinematicIntroContent, 'title' | 'subtitle' | 'buttonText' | 'audioUrl'>, value: string) => {
      updateContent((previousContent) => {
        const nextContent = { ...previousContent }
        const normalizedValue = value.trim()

        if (key === 'audioUrl' && normalizedValue.length === 0) {
          delete nextContent[key]
        } else {
          nextContent[key] = value
        }

        return nextContent
      })
    },
    [updateContent],
  )

  const updateContentValue = useCallback(
    (key: keyof CinematicIntroContent, value: JsonValue) => {
      updateContent((previousContent) => ({
        ...previousContent,
        [key]: value,
      }))
    },
    [updateContent],
  )

  return (
    <section className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-200">Cinematic intro content</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          These fields save into the section content JSON. Intro audio is stored as <code>audioUrl</code>.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="text-zinc-300">Intro title</span>
          <input
            type="text"
            value={getEditorStringValue(editorContent, 'title', resolvedContent.title)}
            onChange={(event) => {
              updateString('title', event.currentTarget.value)
            }}
            className={textInputClassName}
            disabled={disabled}
          />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="text-zinc-300">Button text</span>
          <input
            type="text"
            value={getEditorStringValue(editorContent, 'buttonText', resolvedContent.buttonText)}
            onChange={(event) => {
              updateString('buttonText', event.currentTarget.value)
            }}
            className={textInputClassName}
            disabled={disabled}
          />
        </label>
      </div>

      <label className="block space-y-1.5 text-sm">
        <span className="text-zinc-300">Subtitle</span>
        <textarea
          value={getEditorStringValue(editorContent, 'subtitle', resolvedContent.subtitle)}
          onChange={(event) => {
            updateString('subtitle', event.currentTarget.value)
          }}
          className="min-h-24 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-500 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
        />
      </label>

      <UploadField
        label="Intro audio"
        target="music"
        name="cinematic_intro_audio_url"
        defaultValue={resolvedContent.audioUrl || null}
        disabled={disabled}
        helperText="Uploads audio/music and saves the public URL into content.audioUrl."
        onValueChange={(value) => {
          updateString('audioUrl', value ?? '')
        }}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="space-y-1.5 text-sm">
          <span className="text-zinc-300">Background mode</span>
          <select
            value={resolvedContent.backgroundMode}
            onChange={(event) => {
              updateContentValue('backgroundMode', event.currentTarget.value)
            }}
            className={textInputClassName}
            disabled={disabled}
          >
            <option value="image">image</option>
            <option value="gradient">gradient</option>
          </select>
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="text-zinc-300">Typing speed</span>
          <input
            type="number"
            min={15}
            max={250}
            step={1}
            value={resolvedContent.typingSpeed}
            onChange={(event) => {
              updateContentValue('typingSpeed', event.currentTarget.valueAsNumber)
            }}
            className={numberInputClassName}
            disabled={disabled}
          />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="text-zinc-300">Overlay opacity ({resolvedContent.overlayOpacity.toFixed(2)})</span>
          <input
            type="range"
            min={0.2}
            max={0.85}
            step={0.05}
            value={resolvedContent.overlayOpacity}
            onChange={(event) => {
              updateContentValue('overlayOpacity', event.currentTarget.valueAsNumber)
            }}
            className="h-10 w-full accent-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['showParticles', 'Show particles'],
          ['enableGlow', 'Enable romantic glow'],
          ['enableMusic', 'Enable intro audio controls'],
          ['autoPlayMusic', 'Attempt autoplay after entry gate'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={Boolean(resolvedContent[key as keyof CinematicIntroContent])}
              onChange={(event) => {
                updateContentValue(key as keyof CinematicIntroContent, event.currentTarget.checked)
              }}
              className={checkboxClassName}
              disabled={disabled}
            />
            {label}
          </label>
        ))}
      </div>
    </section>
  )
}
