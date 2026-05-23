import type { Session } from '@supabase/supabase-js'

export interface AuthContextValue {
  session: Session | null
  isLoading: boolean
}
