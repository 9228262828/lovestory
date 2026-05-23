import { useEffect, useState } from 'react'
import { sectionsService } from '@/services/supabase/sections.service'
import type { RomanticSection } from '@/types/section'

interface UsePublicSectionsResult {
  sections: RomanticSection[]
  isLoading: boolean
  errorMessage: string | null
}

export const usePublicSections = (): UsePublicSectionsResult => {
  const [sections, setSections] = useState<RomanticSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadSections = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await sectionsService.getEnabledSections()

        if (isMounted) {
          setSections(response)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load sections.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSections()

    return () => {
      isMounted = false
    }
  }, [])

  return { sections, isLoading, errorMessage }
}
