import { supabase } from '@/services/supabase/client'
import type { JsonValue } from '@/types/section'

const KISS_EVENTS_TABLE = 'kiss_events'
const DAILY_KISS_STATS_TABLE = 'daily_kiss_stats'
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

export interface DailyKissCounts {
  dayKey: string
  todayKisses: number
  yesterdayKisses: number
}

interface DailyKissStatRow {
  day: string
  total_kisses: number
}

type KissEventListener = (event: KissEvent) => void

export interface KissEventSubscription {
  unsubscribe: () => Promise<void>
}

const getUtcDayKey = (date: Date): string => {
  return date.toISOString().slice(0, 10)
}

const getPreviousUtcDayKey = (dayKey: string): string => {
  const date = new Date(`${dayKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return getUtcDayKey(date)
}

const getDayRangeUtcIso = (dayKey: string): { start: string; end: string } => {
  const start = new Date(`${dayKey}T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
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
    value: typeof record.value === 'number' && Number.isFinite(record.value) ? record.value : 1,
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

const getAggregatedCountForDay = async (dayKey: string): Promise<number> => {
  const range = getDayRangeUtcIso(dayKey)

  const { data, error } = await supabase
    .from(KISS_EVENTS_TABLE)
    .select('value')
    .eq('type', 'kiss')
    .gte('created_at', range.start)
    .lt('created_at', range.end)

  if (error) {
    throw error
  }

  return (data ?? []).reduce((sum, item) => {
    const nextValue = typeof item.value === 'number' && Number.isFinite(item.value) ? item.value : 1
    return sum + nextValue
  }, 0)
}

const getAggregatedTotalKissCount = async (): Promise<number> => {
  const { data, error } = await supabase.from(KISS_EVENTS_TABLE).select('value').eq('type', 'kiss')

  if (error) {
    throw error
  }

  return (data ?? []).reduce((sum, item) => {
    const nextValue = typeof item.value === 'number' && Number.isFinite(item.value) ? item.value : 1
    return sum + nextValue
  }, 0)
}

export const kissService = {
  getUtcDayKey,

  getPreviousUtcDayKey,

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

  async getDailyKissCounts(referenceDate: Date = new Date()): Promise<DailyKissCounts> {
    const todayKey = getUtcDayKey(referenceDate)
    const yesterdayKey = getPreviousUtcDayKey(todayKey)

    const { data, error } = await supabase
      .from(DAILY_KISS_STATS_TABLE)
      .select('day,total_kisses')
      .in('day', [todayKey, yesterdayKey])

    if (!error) {
      const rows = (data ?? []) as DailyKissStatRow[]
      const todayRow = rows.find((row) => row.day === todayKey)
      const yesterdayRow = rows.find((row) => row.day === yesterdayKey)

      return {
        dayKey: todayKey,
        todayKisses: todayRow?.total_kisses ?? 0,
        yesterdayKisses: yesterdayRow?.total_kisses ?? 0,
      }
    }

    // Fallback for environments that only provision kiss_events.
    const [todayKisses, yesterdayKisses] = await Promise.all([
      getAggregatedCountForDay(todayKey),
      getAggregatedCountForDay(yesterdayKey),
    ])

    return {
      dayKey: todayKey,
      todayKisses,
      yesterdayKisses,
    }
  },

  async getTotalKissCount(): Promise<number> {
    const { data, error } = await supabase.from(DAILY_KISS_STATS_TABLE).select('total_kisses')

    if (!error) {
      return ((data ?? []) as DailyKissStatRow[]).reduce((sum, row) => sum + row.total_kisses, 0)
    }

    // Fallback for environments that only provision kiss_events.
    return getAggregatedTotalKissCount()
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
