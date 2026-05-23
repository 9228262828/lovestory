import { useId, useRef, useState } from 'react'
import { getUploadTargetConfig, type UploadTarget } from '@/features/uploads/config/uploadTargets'
import { storageService } from '@/services/supabase/storage.service'

interface UploadFieldProps {
  label: string
  target: UploadTarget
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  helperText?: string
  namespace?: string
}

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unable to upload file.'
}

export const UploadField = ({
  label,
  target,
  value,
  onChange,
  disabled = false,
  helperText,
  namespace = 'sections',
}: UploadFieldProps) => {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const config = getUploadTargetConfig(target)
  const isBusy = disabled || isUploading || isRemoving

  const handleFileUpload = async (file: File) => {
    if (isBusy) {
      return
    }

    const validation = storageService.validateFile(target, file)
    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage)
      return
    }

    setErrorMessage(null)
    setUploadProgress(0)
    setIsUploading(true)

    try {
      const previousValue = value
      const uploaded = await storageService.uploadFile({
        target,
        file,
        namespace,
        onProgress: setUploadProgress,
      })

      onChange(uploaded.publicUrl)

      if (previousValue) {
        void storageService.deleteFile({
          target,
          publicUrl: previousValue,
        }).catch(() => undefined)
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelectClick = () => {
    if (isBusy) {
      return
    }

    fileInputRef.current?.click()
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      void handleFileUpload(selectedFile)
    }

    event.target.value = ''
  }

  const handleRemove = async () => {
    if (isBusy) {
      return
    }

    if (!value) {
      onChange(null)
      return
    }

    setErrorMessage(null)
    setIsRemoving(true)

    try {
      await storageService.deleteFile({ target, publicUrl: value })
      onChange(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsRemoving(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (isBusy) {
      return
    }

    setIsDragActive(false)
    const droppedFile = event.dataTransfer.files?.[0]
    if (droppedFile) {
      void handleFileUpload(droppedFile)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isBusy) {
      setIsDragActive(true)
    }
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm text-zinc-300">
          {label}
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => {
              void handleRemove()
            }}
            className="rounded-md border border-red-800 px-2.5 py-1 text-xs font-semibold text-red-300 hover:border-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy}
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        ) : null}
      </div>

      <div
        role="button"
        tabIndex={isBusy ? -1 : 0}
        onClick={handleSelectClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleSelectClick()
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`min-h-32 rounded-lg border px-3 py-4 text-sm transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-950/20'
            : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
        } ${isBusy ? 'cursor-progress opacity-80' : 'cursor-pointer'}`}
      >
        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept={config.inputAccept}
          onChange={handleInputChange}
          className="sr-only"
          disabled={isBusy}
        />

        <div className="space-y-2">
          <p className="text-zinc-200">Drop file here or tap to upload</p>
          <p className="text-xs text-zinc-500">
            {helperText ?? `Supported: ${config.inputAccept} • Max ${Math.round(config.maxSizeBytes / 1024 / 1024)}MB`}
          </p>
          {isUploading ? (
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-[width]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-blue-300">Uploading... {uploadProgress}%</p>
            </div>
          ) : null}
        </div>
      </div>

      {value ? (
        <div className="rounded-lg border border-zinc-700 bg-zinc-950/80 p-2">
          {config.previewKind === 'image' ? (
            <img src={value} alt={`${label} preview`} className="max-h-52 w-full rounded-md object-cover" loading="lazy" />
          ) : (
            <audio controls src={value} className="w-full" preload="metadata">
              Your browser does not support audio preview.
            </audio>
          )}
        </div>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-red-800 bg-red-900/20 px-2.5 py-2 text-xs text-red-300">{errorMessage}</p>
      ) : null}
    </div>
  )
}
