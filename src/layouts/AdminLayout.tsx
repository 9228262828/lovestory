import { Outlet } from 'react-router-dom'
import { authService } from '@/services/supabase/auth.service'

export const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium tracking-wide text-zinc-300">Hidden Admin Dashboard</p>
          <button
            type="button"
            onClick={() => {
              void authService.signOut()
            }}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
