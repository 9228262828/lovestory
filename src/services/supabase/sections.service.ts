import { supabase } from '@/services/supabase/client'
import type { RomanticSection } from '@/types/section'

const TABLE_NAME = 'sections'

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
}
