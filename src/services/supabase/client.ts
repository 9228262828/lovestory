import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/config/env'

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey)
