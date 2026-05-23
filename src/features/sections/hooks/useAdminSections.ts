import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRegisteredSectionTypes } from '@/features/sections/registry/sectionRegistry'
import { sectionsService, type SectionUpsertInput } from '@/services/supabase/sections.service'
import type { RomanticSection } from '@/types/section'

type MoveDirection = 'up' | 'down'

interface UseAdminSectionsResult {
  sections: RomanticSection[]
  sectionTypeOptions: string[]
  isLoading: boolean
  isFormSubmitting: boolean
  busySectionIds: string[]
  loadErrorMessage: string | null
  mutationErrorMessage: string | null
  formErrorMessage: string | null
  nextOrderIndex: number
  reloadSections: () => Promise<void>
  clearMutationError: () => void
  clearFormError: () => void
  createSection: (payload: SectionUpsertInput) => Promise<boolean>
  updateSection: (id: string, payload: SectionUpsertInput) => Promise<boolean>
  deleteSection: (id: string) => Promise<boolean>
  toggleSectionEnabled: (section: RomanticSection) => Promise<void>
  moveSection: (sectionId: string, direction: MoveDirection) => Promise<void>
}

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  return error instanceof Error ? error.message : fallbackMessage
}

const sortSections = (items: RomanticSection[]): RomanticSection[] => {
  return [...items].sort((a, b) => {
    if (a.order_index === b.order_index) {
      return a.created_at.localeCompare(b.created_at)
    }

    return a.order_index - b.order_index
  })
}

export const useAdminSections = (): UseAdminSectionsResult => {
  const [sections, setSections] = useState<RomanticSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [busySectionIds, setBusySectionIds] = useState<string[]>([])
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null)
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)

  const markSectionBusy = useCallback((id: string, isBusy: boolean) => {
    setBusySectionIds((previousIds) => {
      if (isBusy) {
        return previousIds.includes(id) ? previousIds : [...previousIds, id]
      }

      return previousIds.filter((existingId) => existingId !== id)
    })
  }, [])

  const reloadSections = useCallback(async () => {
    setIsLoading(true)
    setLoadErrorMessage(null)

    try {
      const data = await sectionsService.getAllSections()
      setSections(sortSections(data))
    } catch (error) {
      setLoadErrorMessage(getErrorMessage(error, 'Unable to load section data.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reloadSections()
  }, [reloadSections])

  const clearMutationError = useCallback(() => {
    setMutationErrorMessage(null)
  }, [])

  const clearFormError = useCallback(() => {
    setFormErrorMessage(null)
  }, [])

  const createSection = useCallback(async (payload: SectionUpsertInput) => {
    setIsFormSubmitting(true)
    setFormErrorMessage(null)
    setMutationErrorMessage(null)

    try {
      const createdSection = await sectionsService.createSection(payload)
      setSections((previousSections) => sortSections([...previousSections, createdSection]))
      return true
    } catch (error) {
      setFormErrorMessage(getErrorMessage(error, 'Unable to create section.'))
      return false
    } finally {
      setIsFormSubmitting(false)
    }
  }, [])

  const updateSection = useCallback(async (id: string, payload: SectionUpsertInput) => {
    setIsFormSubmitting(true)
    setFormErrorMessage(null)
    setMutationErrorMessage(null)

    try {
      const updatedSection = await sectionsService.updateSection(id, payload)

      setSections((previousSections) =>
        sortSections(
          previousSections.map((existingSection) => (existingSection.id === id ? updatedSection : existingSection)),
        ),
      )

      return true
    } catch (error) {
      setFormErrorMessage(getErrorMessage(error, 'Unable to update section.'))
      return false
    } finally {
      setIsFormSubmitting(false)
    }
  }, [])

  const deleteSection = useCallback(
    async (id: string) => {
      setMutationErrorMessage(null)
      markSectionBusy(id, true)

      const previousSections = sections
      setSections((currentSections) => currentSections.filter((section) => section.id !== id))

      try {
        await sectionsService.deleteSection(id)
        return true
      } catch (error) {
        setSections(previousSections)
        setMutationErrorMessage(getErrorMessage(error, 'Unable to delete section.'))
        return false
      } finally {
        markSectionBusy(id, false)
      }
    },
    [markSectionBusy, sections],
  )

  const toggleSectionEnabled = useCallback(
    async (section: RomanticSection) => {
      const targetEnabledState = !section.enabled

      setMutationErrorMessage(null)
      markSectionBusy(section.id, true)
      setSections((currentSections) =>
        currentSections.map((item) => (item.id === section.id ? { ...item, enabled: targetEnabledState } : item)),
      )

      try {
        const updatedSection = await sectionsService.updateSection(section.id, { enabled: targetEnabledState })
        setSections((currentSections) =>
          currentSections.map((item) => (item.id === section.id ? updatedSection : item)),
        )
      } catch (error) {
        setSections((currentSections) =>
          currentSections.map((item) => (item.id === section.id ? { ...item, enabled: section.enabled } : item)),
        )
        setMutationErrorMessage(getErrorMessage(error, 'Unable to update enabled state.'))
      } finally {
        markSectionBusy(section.id, false)
      }
    },
    [markSectionBusy],
  )

  const moveSection = useCallback(
    async (sectionId: string, direction: MoveDirection) => {
      const orderedSections = sortSections(sections)
      const currentIndex = orderedSections.findIndex((section) => section.id === sectionId)

      if (currentIndex === -1) {
        return
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (targetIndex < 0 || targetIndex >= orderedSections.length) {
        return
      }

      const currentSection = orderedSections[currentIndex]
      const targetSection = orderedSections[targetIndex]

      const previousCurrentOrder = currentSection.order_index
      const previousTargetOrder = targetSection.order_index

      setMutationErrorMessage(null)
      markSectionBusy(currentSection.id, true)
      markSectionBusy(targetSection.id, true)

      setSections((currentSections) =>
        sortSections(
          currentSections.map((section) => {
            if (section.id === currentSection.id) {
              return { ...section, order_index: previousTargetOrder }
            }

            if (section.id === targetSection.id) {
              return { ...section, order_index: previousCurrentOrder }
            }

            return section
          }),
        ),
      )

      try {
        const [updatedCurrentSection, updatedTargetSection] = await Promise.all([
          sectionsService.updateSection(currentSection.id, { order_index: previousTargetOrder }),
          sectionsService.updateSection(targetSection.id, { order_index: previousCurrentOrder }),
        ])

        setSections((currentSections) =>
          sortSections(
            currentSections.map((section) => {
              if (section.id === updatedCurrentSection.id) {
                return updatedCurrentSection
              }

              if (section.id === updatedTargetSection.id) {
                return updatedTargetSection
              }

              return section
            }),
          ),
        )
      } catch (error) {
        setSections(orderedSections)
        setMutationErrorMessage(getErrorMessage(error, 'Unable to reorder section.'))
      } finally {
        markSectionBusy(currentSection.id, false)
        markSectionBusy(targetSection.id, false)
      }
    },
    [markSectionBusy, sections],
  )

  const sectionTypeOptions = useMemo(() => {
    const knownTypes = getRegisteredSectionTypes()
    const dataTypes = sections.map((section) => section.type).filter((type) => type.trim().length > 0)
    return Array.from(new Set([...knownTypes, ...dataTypes])).sort((left, right) => left.localeCompare(right))
  }, [sections])

  const nextOrderIndex = useMemo(() => {
    if (sections.length === 0) {
      return 0
    }

    return Math.max(...sections.map((section) => section.order_index)) + 1
  }, [sections])

  return {
    sections,
    sectionTypeOptions,
    isLoading,
    isFormSubmitting,
    busySectionIds,
    loadErrorMessage,
    mutationErrorMessage,
    formErrorMessage,
    nextOrderIndex,
    reloadSections,
    clearMutationError,
    clearFormError,
    createSection,
    updateSection,
    deleteSection,
    toggleSectionEnabled,
    moveSection,
  }
}
