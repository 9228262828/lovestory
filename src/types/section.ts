export type JsonValue =
  | string
  | number
  | boolean
  | null
  | {
      [key: string]: JsonValue
    }
  | JsonValue[]

export type SectionType = 'hero' | 'story' | 'timeline' | 'gallery' | 'custom'

export interface RomanticSection {
  id: string
  title: string
  type: SectionType | string
  enabled: boolean
  order_index: number
  content: JsonValue
  created_at: string
}
