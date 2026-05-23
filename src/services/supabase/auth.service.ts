import { supabase } from '@/services/supabase/client'

export const authService = {
  getSession: () => supabase.auth.getSession(),
  signInWithOtp: (email: string) => supabase.auth.signInWithOtp({ email }),
  signOut: () => supabase.auth.signOut(),
}
