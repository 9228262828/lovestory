import { supabaseConfig } from '@/config/env'
import { getUploadTargetConfig, type UploadTarget } from '@/features/uploads/config/uploadTargets'
import {
  buildStorageObjectEndpointPath,
  buildUploadObjectPath,
  extractStorageObjectPathFromPublicUrl,
  validateUploadFileByTarget,
  type UploadValidationResult,
} from '@/features/uploads/utils/upload.utils'
import { supabase } from '@/services/supabase/client'

interface UploadFileOptions {
  target: UploadTarget
  file: File
  namespace?: string
  upsert?: boolean
  onProgress?: (progress: number) => void
}

interface DeleteFileOptions {
  target: UploadTarget
  objectPath?: string
  publicUrl?: string
}

export interface UploadedFileResult {
  bucket: string
  objectPath: string
  publicUrl: string
}

const uploadWithProgress = async ({
  token,
  bucket,
  objectPath,
  file,
  upsert = false,
  onProgress,
}: {
  token: string
  bucket: string
  objectPath: string
  file: File
  upsert?: boolean
  onProgress?: (progress: number) => void
}): Promise<void> => {
  const endpointPath = buildStorageObjectEndpointPath(bucket, objectPath)
  const uploadUrl = `${supabaseConfig.url}/storage/v1/object/${endpointPath}`

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', uploadUrl)
    request.setRequestHeader('apikey', supabaseConfig.anonKey)
    request.setRequestHeader('Authorization', `Bearer ${token}`)
    request.setRequestHeader('x-upsert', upsert ? 'true' : 'false')
    request.setRequestHeader('cache-control', '3600')
    request.setRequestHeader('content-type', file.type || 'application/octet-stream')

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return
      }

      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
    }

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        if (onProgress) {
          onProgress(100)
        }
        resolve()
        return
      }

      const fallbackMessage = `Upload failed with status ${request.status}.`
      const responseText = request.responseText?.trim()

      try {
        if (responseText) {
          const parsed = JSON.parse(responseText) as { error?: string; message?: string }
          reject(new Error(parsed.error ?? parsed.message ?? fallbackMessage))
          return
        }
      } catch {
        // Ignore parsing errors and use fallback below.
      }

      reject(new Error(responseText || fallbackMessage))
    }

    request.onerror = () => {
      reject(new Error('Network error occurred during file upload.'))
    }

    request.onabort = () => {
      reject(new Error('Upload was cancelled before completion.'))
    }

    request.send(file)
  })
}

const resolveAuthToken = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? supabaseConfig.anonKey
}

export const storageService = {
  validateFile(target: UploadTarget, file: File): UploadValidationResult {
    return validateUploadFileByTarget(file, target)
  },

  generatePublicUrl(target: UploadTarget, objectPath: string): string {
    const { bucket } = getUploadTargetConfig(target)
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath)
    return data.publicUrl
  },

  async uploadFile({
    target,
    file,
    namespace,
    upsert = false,
    onProgress,
  }: UploadFileOptions): Promise<UploadedFileResult> {
    const validation = this.validateFile(target, file)
    if (!validation.isValid) {
      throw new Error(validation.errorMessage ?? 'Selected file is not valid for upload.')
    }

    const { bucket } = getUploadTargetConfig(target)
    const objectPath = buildUploadObjectPath({
      target,
      fileName: file.name,
      namespace,
    })
    const token = await resolveAuthToken()

    await uploadWithProgress({
      token,
      bucket,
      objectPath,
      file,
      upsert,
      onProgress,
    })

    return {
      bucket,
      objectPath,
      publicUrl: this.generatePublicUrl(target, objectPath),
    }
  },

  async deleteFile({ target, objectPath, publicUrl }: DeleteFileOptions): Promise<void> {
    const { bucket } = getUploadTargetConfig(target)
    const resolvedObjectPath =
      objectPath ??
      (publicUrl ? extractStorageObjectPathFromPublicUrl(publicUrl, bucket) : null)

    if (!resolvedObjectPath) {
      return
    }

    const { error } = await supabase.storage.from(bucket).remove([resolvedObjectPath])
    if (error) {
      throw error
    }
  },
}
