export type JsonValue =
  | string
  | number
  | boolean
  | null
  | {
      [key: string]: JsonValue
    }
  | JsonValue[]

export type SectionType =
  | 'hero'
  | 'story'
  | 'timeline'
  | 'gallery'
  | 'custom'
  | 'cinematic-intro'
  | '3d-gallery'
  | 'kiss-counter'

export interface RomanticSection {
  id: string
  title: string
  type: SectionType | string
  enabled: boolean
  order_index: number
  content: JsonValue
  image_url: string | null
  music_url: string | null
  voice_note_url: string | null
  created_at: string
}
