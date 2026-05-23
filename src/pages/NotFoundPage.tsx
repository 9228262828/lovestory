import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Page not found</h1>
        <Link className="mt-4 inline-block text-sm font-medium text-rose-600 hover:text-rose-700" to={ROUTES.home}>
          Go back home
        </Link>
      </div>
    </div>
  )
}
