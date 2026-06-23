import { useCallback, useEffect, useState } from 'react'
import { kissService, type KissEvent } from '@/services/kiss.service'
import { useKissStream } from '@/hooks/useKissStream'

interface UseTotalKissCountResult {
  totalKisses: number
  isLoading: boolean
  errorMessage: string | null
  refreshCount: () => Promise<void>
}

export const useTotalKissCount = (): UseTotalKissCountResult => {
  const [totalKisses, setTotalKisses] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshCount = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const nextTotalKisses = await kissService.getAllTimeKissCount()
      setTotalKisses(nextTotalKisses)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'العداد محتاج حضن صغير وهيتحدث تاني ❤️')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshCount()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [refreshCount])

  const handleRealtimeInsertBatch = useCallback((events: KissEvent[]) => {
    if (events.length === 0) {
      return
    }

    setTotalKisses((currentTotal) => {
      return events.reduce((sum, event) => sum + event.value, currentTotal)
    })
    setIsLoading(false)
    setErrorMessage(null)
  }, [])

  useKissStream({ onKissEvents: handleRealtimeInsertBatch })

  return {
    totalKisses,
    isLoading,
    errorMessage,
    refreshCount,
  }
}
