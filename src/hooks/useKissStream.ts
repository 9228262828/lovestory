import { useCallback, useEffect, useState } from 'react'
import { kissService, type KissEvent, type KissEventSubscription } from '@/services/kiss.service'
import type { JsonValue } from '@/types/section'

type KissListener = (event: KissEvent) => void
type KissBatchListener = (events: KissEvent[]) => void

interface StreamListener {
  onSingle?: KissListener
  onBatch?: KissBatchListener
}

const STREAM_BATCH_WINDOW_MS = 75
const STREAM_DEDUPE_TTL_MS = 12_000
const STREAM_DEDUPE_MAX_IDS = 600

const streamListeners = new Set<StreamListener>()
let streamSubscription: KissEventSubscription | null = null
let streamBatchTimeout: ReturnType<typeof setTimeout> | null = null
let queuedKissEvents: KissEvent[] = []
const recentEventIds = new Map<string, number>()

const trimRecentEventIds = (now: number) => {
  recentEventIds.forEach((timestamp, eventId) => {
    if (now - timestamp > STREAM_DEDUPE_TTL_MS) {
      recentEventIds.delete(eventId)
    }
  })

  if (recentEventIds.size <= STREAM_DEDUPE_MAX_IDS) {
    return
  }

  const overflowCount = recentEventIds.size - STREAM_DEDUPE_MAX_IDS
  let removedCount = 0

  for (const eventId of recentEventIds.keys()) {
    recentEventIds.delete(eventId)
    removedCount += 1
    if (removedCount >= overflowCount) {
      break
    }
  }
}

const flushQueuedKissEvents = () => {
  if (queuedKissEvents.length === 0 || streamListeners.size === 0) {
    queuedKissEvents = []
    return
  }

  const batch = queuedKissEvents
  queuedKissEvents = []

  streamListeners.forEach((listener) => {
    if (listener.onBatch) {
      listener.onBatch(batch)
      return
    }

    if (listener.onSingle) {
      batch.forEach((event) => {
        listener.onSingle?.(event)
      })
    }
  })
}

const scheduleKissBatchFlush = () => {
  if (streamBatchTimeout !== null) {
    return
  }

  streamBatchTimeout = setTimeout(() => {
    streamBatchTimeout = null
    flushQueuedKissEvents()
  }, STREAM_BATCH_WINDOW_MS)
}

const enqueueKissEvent = (event: KissEvent) => {
  const now = Date.now()
  trimRecentEventIds(now)

  if (recentEventIds.has(event.id)) {
    return
  }

  recentEventIds.set(event.id, now)
  queuedKissEvents.push(event)
  scheduleKissBatchFlush()
}

const ensureSubscription = () => {
  if (streamSubscription) {
    return
  }

  streamSubscription = kissService.subscribeToKissEvents((event) => {
    enqueueKissEvent(event)
  })
}

const destroySubscriptionIfIdle = () => {
  if (streamListeners.size > 0 || !streamSubscription) {
    return
  }

  const currentSubscription = streamSubscription
  streamSubscription = null
  queuedKissEvents = []

  if (streamBatchTimeout !== null) {
    clearTimeout(streamBatchTimeout)
    streamBatchTimeout = null
  }

  void currentSubscription.unsubscribe()
}

interface UseKissStreamOptions {
  onKissEvent?: KissListener
  onKissEvents?: KissBatchListener
}

interface UseKissStreamResult {
  sendKiss: (metadata?: JsonValue) => Promise<boolean>
  isSending: boolean
  sendErrorMessage: string | null
}

export const useKissStream = ({ onKissEvent, onKissEvents }: UseKissStreamOptions = {}): UseKissStreamResult => {
  const [isSending, setIsSending] = useState(false)
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!onKissEvent && !onKissEvents) {
      return
    }

    const listener: StreamListener = {
      onSingle: onKissEvent,
      onBatch: onKissEvents,
    }

    streamListeners.add(listener)
    ensureSubscription()

    return () => {
      streamListeners.delete(listener)
      destroySubscriptionIfIdle()
    }
  }, [onKissEvent, onKissEvents])

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
