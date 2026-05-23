import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { router } from '@/app/router'
import { supabaseConfig } from '@/config/env'

const MissingSupabaseEnvScreen = () => {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 px-6 py-10">
      <h1 className="text-2xl font-semibold text-rose-900">Supabase environment is not configured</h1>
      <p className="text-sm text-zinc-700">
        The app cannot start Supabase features because required `import.meta.env` variables are missing.
      </p>
      <div className="rounded-lg border border-rose-200 bg-white p-4">
        <p className="text-sm font-medium text-rose-900">Missing keys:</p>
        <ul className="mt-2 list-disc pl-6 text-sm text-zinc-700">
          {supabaseConfig.missingKeys.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
      </div>
      <p className="text-sm text-zinc-700">Add them to a root .env.local file and restart the dev server.</p>
    </main>
  )
}

export const App = () => {
  if (!supabaseConfig.isConfigured) {
    return <MissingSupabaseEnvScreen />
  }

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
