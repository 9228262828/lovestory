import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/config/env'

const fallbackSupabaseConfig = {
  url: 'http://127.0.0.1',
  anonKey: 'missing-supabase-anon-key',
} as const

const runtimeSupabaseConfig = supabaseConfig.isConfigured
  ? {
      url: supabaseConfig.url,
      anonKey: supabaseConfig.anonKey,
    }
  : fallbackSupabaseConfig

if (!supabaseConfig.isConfigured) {
  console.error(
    '[env] Supabase client started with fallback values because required environment variables are missing.',
  )
}

export const supabase = createClient(runtimeSupabaseConfig.url, runtimeSupabaseConfig.anonKey)
