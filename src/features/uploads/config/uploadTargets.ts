export type UploadTarget = 'image' | 'music' | 'voice-note'

export type UploadPreviewKind = 'image' | 'audio'

export interface UploadTargetConfig {
  bucket: string
  inputAccept: string
  previewKind: UploadPreviewKind
  allowedMimeTypes: string[]
  allowedExtensions: string[]
  maxSizeBytes: number
}

const megabyte = 1024 * 1024

export const uploadTargetConfig: Record<UploadTarget, UploadTargetConfig> = {
  image: {
    bucket: 'images',
    inputAccept: 'image/*',
    previewKind: 'image',
    allowedMimeTypes: ['image/*'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'],
    maxSizeBytes: 10 * megabyte,
  },
  music: {
    bucket: 'music',
    inputAccept: 'audio/*',
    previewKind: 'audio',
    allowedMimeTypes: ['audio/*'],
    allowedExtensions: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'webm', 'mp4'],
    maxSizeBytes: 30 * megabyte,
  },
  'voice-note': {
    bucket: 'voice-notes',
    inputAccept: 'audio/*',
    previewKind: 'audio',
    allowedMimeTypes: ['audio/*'],
    allowedExtensions: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm', 'mp4'],
    maxSizeBytes: 15 * megabyte,
  },
}

export const getUploadTargetConfig = (target: UploadTarget): UploadTargetConfig => {
  return uploadTargetConfig[target]
}
