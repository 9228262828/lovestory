import { supabase } from '@/services/supabase/client'

export const authService = {
  getSession: () => supabase.auth.getSession(),
  signInWithPassword: (email: string, password: string) =>
    supabase.auth.signInWithPassword({
      email,
      password,
    }),
  signOut: () => supabase.auth.signOut(),
}
