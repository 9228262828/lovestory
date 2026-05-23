import type { PropsWithChildren } from 'react'
import { AuthProvider } from '@/features/auth/context/AuthContext'

export const AppProviders = ({ children }: PropsWithChildren) => {
  return <AuthProvider>{children}</AuthProvider>
}
