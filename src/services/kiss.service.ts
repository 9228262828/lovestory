import { supabase } from '@/services/supabase/client'
import type { JsonValue } from '@/types/section'

const KISS_EVENTS_TABLE = 'kiss_events'
const KISS_COUNT_PAGE_SIZE = 1_000
const MAX_EVENTS_PER_SECOND = 10
const THROTTLE_WINDOW_MS = 1_000

const recentInsertTimestamps: number[] = []

export interface KissEvent {
  id: string
  created_at: string
  type: string
  value: number
  metadata: JsonValue | null
}

type KissEventListener = (event: KissEvent) => void

export interface KissEventSubscription {
  unsubscribe: () => Promise<void>
}

const normalizeKissValue = (value: unknown): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : 1
}

const toKissEvent = (value: unknown): KissEvent | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>

  if (typeof record.id !== 'string' || typeof record.created_at !== 'string') {
    return null
  }

  return {
    id: record.id,
    created_at: record.created_at,
    type: typeof record.type === 'string' ? record.type : 'kiss',
    value: normalizeKissValue(record.value),
    metadata: (record.metadata as JsonValue | null | undefined) ?? null,
  }
}

const enforceInsertThrottle = () => {
  const now = Date.now()

  while (recentInsertTimestamps.length > 0 && now - recentInsertTimestamps[0] >= THROTTLE_WINDOW_MS) {
    recentInsertTimestamps.shift()
  }

  if (recentInsertTimestamps.length >= MAX_EVENTS_PER_SECOND) {
    throw new Error('Kiss event rate limit reached. Please tap a little slower.')
  }

  recentInsertTimestamps.push(now)
}

const getAggregatedAllTimeKissCount = async (): Promise<number> => {
  let totalKisses = 0
  let from = 0

  while (true) {
    const to = from + KISS_COUNT_PAGE_SIZE - 1
    const { data, error } = await supabase
      .from(KISS_EVENTS_TABLE)
      .select('value')
      .eq('type', 'kiss')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)

    if (error) {
      throw error
    }

    const rows = data ?? []
    totalKisses += rows.reduce((sum, item) => {
      return sum + normalizeKissValue(item.value)
    }, 0)

    if (rows.length < KISS_COUNT_PAGE_SIZE) {
      return totalKisses
    }

    from += KISS_COUNT_PAGE_SIZE
  }
}

export const kissService = {
  async createKissEvent(metadata?: JsonValue): Promise<KissEvent> {
    enforceInsertThrottle()

    const { data, error } = await supabase
      .from(KISS_EVENTS_TABLE)
      .insert({
        type: 'kiss',
        value: 1,
        metadata: metadata ?? null,
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const event = toKissEvent(data)
    if (!event) {
      throw new Error('Failed to parse inserted kiss event.')
    }

    return event
  },

  async getAllTimeKissCount(): Promise<number> {
    return getAggregatedAllTimeKissCount()
  },

  subscribeToKissEvents(onInsert: KissEventListener): KissEventSubscription {
    const channel = supabase
      .channel(`kiss-events-stream-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: KISS_EVENTS_TABLE,
        },
        (payload) => {
          const event = toKissEvent(payload.new)
          if (!event || event.type !== 'kiss') {
            return
          }

          onInsert(event)
        },
      )
      .subscribe()

    return {
      unsubscribe: async () => {
        await supabase.removeChannel(channel)
      },
    }
  },
}
