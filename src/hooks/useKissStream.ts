import { useCallback, useEffect, useState } from 'react'
import { kissService, type KissEvent, type KissEventSubscription } from '@/services/kiss.service'
import type { JsonValue } from '@/types/section'

type KissListener = (event: KissEvent) => void

const streamListeners = new Set<KissListener>()
let streamSubscription: KissEventSubscription | null = null

const dispatchKissEvent = (event: KissEvent) => {
  streamListeners.forEach((listener) => {
    listener(event)
  })
}

const ensureSubscription = () => {
  if (streamSubscription) {
    return
  }

  streamSubscription = kissService.subscribeToKissEvents((event) => {
    dispatchKissEvent(event)
  })
}

const destroySubscriptionIfIdle = () => {
  if (streamListeners.size > 0 || !streamSubscription) {
    return
  }

  const currentSubscription = streamSubscription
  streamSubscription = null
  void currentSubscription.unsubscribe()
}

interface UseKissStreamOptions {
  onKissEvent?: KissListener
}

interface UseKissStreamResult {
  sendKiss: (metadata?: JsonValue) => Promise<boolean>
  isSending: boolean
  sendErrorMessage: string | null
}

export const useKissStream = ({ onKissEvent }: UseKissStreamOptions = {}): UseKissStreamResult => {
  const [isSending, setIsSending] = useState(false)
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!onKissEvent) {
      return
    }

    streamListeners.add(onKissEvent)
    ensureSubscription()

    return () => {
      streamListeners.delete(onKissEvent)
      destroySubscriptionIfIdle()
    }
  }, [onKissEvent])

  const sendKiss = useCallback(async (metadata?: JsonValue) => {
    setIsSending(true)
    setSendErrorMessage(null)

    try {
      await kissService.createKissEvent(metadata)
      return true
    } catch (error) {
      setSendErrorMessage(error instanceof Error ? error.message : 'Unable to send kiss right now.')
      return false
    } finally {
      setIsSending(false)
    }
  }, [])

  return {
    sendKiss,
    isSending,
    sendErrorMessage,
  }
}
