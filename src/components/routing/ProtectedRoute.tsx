import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { ROUTES } from '@/shared/constants/routes'

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const { isLoading, session } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-zinc-600">
        Checking access...
      </div>
    )
  }

  if (!session) {
    return <Navigate replace to={ROUTES.login} />
  }

  return <>{children}</>
}
