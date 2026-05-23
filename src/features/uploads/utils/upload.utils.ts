import type { UploadTarget } from '@/features/uploads/config/uploadTargets'
import { getUploadTargetConfig, type UploadTargetConfig } from '@/features/uploads/config/uploadTargets'

export interface UploadValidationResult {
  isValid: boolean
  errorMessage: string | null
}

interface BuildObjectPathOptions {
  target: UploadTarget
  fileName: string
  namespace?: string
}

const filenameSanitizePattern = /[^a-zA-Z0-9._-]/g

const formatMaxSizeLabel = (bytes: number): string => {
  const inMegabytes = bytes / (1024 * 1024)
  return `${inMegabytes.toFixed(inMegabytes >= 10 ? 0 : 1)} MB`
}

const getFileExtension = (filename: string): string | null => {
  const parts = filename.split('.')
  if (parts.length < 2) {
    return null
  }

  return parts.at(-1)?.toLowerCase() ?? null
}

const sanitizeFileName = (filename: string): string => {
  return filename.replace(filenameSanitizePattern, '-').replace(/-+/g, '-')
}

const isMimeTypeAllowed = (fileMimeType: string, allowedMimeTypes: string[]): boolean => {
  if (!fileMimeType) {
    return false
  }

  return allowedMimeTypes.some((allowedMimeType) => {
    if (allowedMimeType.endsWith('/*')) {
      const group = allowedMimeType.split('/')[0]
      return fileMimeType.startsWith(`${group}/`)
    }

    return fileMimeType === allowedMimeType
  })
}

const isFileExtensionAllowed = (filename: string, allowedExtensions: string[]): boolean => {
  const extension = getFileExtension(filename)
  if (!extension) {
    return false
  }

  return allowedExtensions.includes(extension)
}

export const validateUploadFile = (file: File, config: UploadTargetConfig): UploadValidationResult => {
  if (file.size > config.maxSizeBytes) {
    return {
      isValid: false,
      errorMessage: `File is too large. Max size is ${formatMaxSizeLabel(config.maxSizeBytes)}.`,
    }
  }

  if (!isMimeTypeAllowed(file.type, config.allowedMimeTypes)) {
    if (!isFileExtensionAllowed(file.name, config.allowedExtensions)) {
      return {
        isValid: false,
        errorMessage: 'Selected file type is not supported.',
      }
    }
  }

  return {
    isValid: true,
    errorMessage: null,
  }
}

export const validateUploadFileByTarget = (file: File, target: UploadTarget): UploadValidationResult => {
  const config = getUploadTargetConfig(target)
  return validateUploadFile(file, config)
}

export const buildUploadObjectPath = ({ target, fileName, namespace = 'sections' }: BuildObjectPathOptions): string => {
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const timestamp = now.getTime()
  const randomSuffix = Math.random().toString(36).slice(2, 10)
  const cleanedFileName = sanitizeFileName(fileName)

  return `${namespace}/${target}/${year}/${month}/${timestamp}-${randomSuffix}-${cleanedFileName}`
}

export const buildStorageObjectEndpointPath = (bucket: string, objectPath: string): string => {
  const encodedObjectPath = objectPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${bucket}/${encodedObjectPath}`
}

export const extractStorageObjectPathFromPublicUrl = (
  publicUrl: string,
  expectedBucket: string,
): string | null => {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(publicUrl)
  } catch {
    return null
  }

  const match = parsedUrl.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
  if (!match) {
    return null
  }

  const [, matchedBucket, rawPath] = match
  if (matchedBucket !== expectedBucket) {
    return null
  }

  return rawPath
    .split('/')
    .map((segment) => decodeURIComponent(segment))
    .join('/')
}
