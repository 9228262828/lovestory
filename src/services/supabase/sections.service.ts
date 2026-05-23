import { supabase } from '@/services/supabase/client'
import type { JsonValue, RomanticSection } from '@/types/section'

const TABLE_NAME = 'sections'

export interface SectionUpsertInput {
  title: string
  type: string
  enabled: boolean
  order_index: number
  content: JsonValue
}

export interface SectionUpdateInput extends Partial<SectionUpsertInput> {}

export const sectionsService = {
  async getEnabledSections(): Promise<RomanticSection[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('enabled', true)
      .order('order_index', { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []) as RomanticSection[]
  },

  async getAllSections(): Promise<RomanticSection[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('order_index', { ascending: true })

    if (error) {
      throw error
    }

    return (data ?? []) as RomanticSection[]
  },

  async createSection(payload: SectionUpsertInput): Promise<RomanticSection> {
    const { data, error } = await supabase.from(TABLE_NAME).insert(payload).select('*').single()

    if (error) {
      throw error
    }

    return data as RomanticSection
  },

  async updateSection(id: string, payload: SectionUpdateInput): Promise<RomanticSection> {
    const { data, error } = await supabase.from(TABLE_NAME).update(payload).eq('id', id).select('*').single()

    if (error) {
      throw error
    }

    return data as RomanticSection
  },

  async deleteSection(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id)

    if (error) {
      throw error
    }
  },
}
