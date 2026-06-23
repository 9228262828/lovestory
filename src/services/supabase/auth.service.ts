import { supabase } from '@/services/supabase/client'

const ADMIN_REDIRECT_URL = import.meta.env.PROD
  ? 'https://9228262828.github.io/lovestory/admin'
  : 'http://localhost:5173/admin'

export const authService = {
  getSession: () => supabase.auth.getSession(),
  signInWithOtp: (email: string) =>
    supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: ADMIN_REDIRECT_URL,
      },
    }),
  signOut: () => supabase.auth.signOut(),
}
