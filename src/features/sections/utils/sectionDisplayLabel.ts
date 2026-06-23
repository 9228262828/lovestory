import type { JsonValue, RomanticSection } from '@/types/section'

export const isJsonRecord = (value: JsonValue): value is Record<string, JsonValue> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const getSectionDisplayLabel = (section: RomanticSection): string | null => {
  if (!isJsonRecord(section.content) || section.content.showLabel !== true) {
    return null
  }

  const displayLabel = section.content.displayLabel

  if (typeof displayLabel !== 'string') {
    return null
  }

  const normalizedDisplayLabel = displayLabel.trim()

  return normalizedDisplayLabel.length > 0 ? normalizedDisplayLabel : null
}
