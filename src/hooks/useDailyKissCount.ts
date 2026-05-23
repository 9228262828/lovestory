import { useCallback, useEffect, useState } from 'react'
import { kissService, type DailyKissCounts, type KissEvent } from '@/services/kiss.service'
import { useKissStream } from '@/hooks/useKissStream'

interface DailyKissState extends DailyKissCounts {
  isLoading: boolean
  errorMessage: string | null
}

interface UseDailyKissCountResult {
  todayKisses: number
  yesterdayKisses: number
  isLoading: boolean
  errorMessage: string | null
  refreshCounts: () => Promise<void>
}

const getDefaultState = (): DailyKissState => {
  const now = new Date()
  return {
    dayKey: kissService.getUtcDayKey(now),
    todayKisses: 0,
    yesterdayKisses: 0,
    isLoading: true,
    errorMessage: null,
  }
}

const getMillisecondsUntilNextUtcDay = (): number => {
  const now = new Date()
  const nextMidnight = new Date(now)
  nextMidnight.setUTCHours(24, 0, 0, 0)
  return Math.max(100, nextMidnight.getTime() - now.getTime())
}

const applyIncomingEvent = (previous: DailyKissState, event: KissEvent): DailyKissState => {
  const currentDayKey = kissService.getUtcDayKey(new Date())
  const previousDayKey = kissService.getPreviousUtcDayKey(currentDayKey)
  const eventDayKey = kissService.getUtcDayKey(new Date(event.created_at))

  const normalizedState =
    previous.dayKey === currentDayKey
      ? previous
      : {
          ...previous,
          dayKey: currentDayKey,
          todayKisses: 0,
          yesterdayKisses: previous.dayKey === previousDayKey ? previous.todayKisses : 0,
        }

  if (eventDayKey === currentDayKey) {
    return {
      ...normalizedState,
      todayKisses: normalizedState.todayKisses + event.value,
    }
  }

  if (eventDayKey === previousDayKey) {
    return {
      ...normalizedState,
      yesterdayKisses: normalizedState.yesterdayKisses + event.value,
    }
  }

  return normalizedState
}

export const useDailyKissCount = (): UseDailyKissCountResult => {
  const [state, setState] = useState<DailyKissState>(() => getDefaultState())

  const refreshCounts = useCallback(async () => {
    setState((previousState) => ({
      ...previousState,
      isLoading: true,
      errorMessage: null,
    }))

    try {
      const counts = await kissService.getDailyKissCounts()

      setState((previousState) => ({
        ...previousState,
        ...counts,
        isLoading: false,
        errorMessage: null,
      }))
    } catch (error) {
      setState((previousState) => ({
        ...previousState,
        isLoading: false,
        errorMessage: error instanceof Error ? error.message : 'Unable to load kiss count.',
      }))
    }
  }, [])

  useEffect(() => {
    void refreshCounts()
  }, [refreshCounts])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshCounts()
    }, getMillisecondsUntilNextUtcDay() + 200)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [state.dayKey, refreshCounts])

  const handleRealtimeInsert = useCallback((event: KissEvent) => {
    setState((previousState) => ({
      ...applyIncomingEvent(previousState, event),
      isLoading: false,
      errorMessage: null,
    }))
  }, [])

  useKissStream({ onKissEvent: handleRealtimeInsert })

  return {
    todayKisses: state.todayKisses,
    yesterdayKisses: state.yesterdayKisses,
    isLoading: state.isLoading,
    errorMessage: state.errorMessage,
    refreshCounts,
  }
}
