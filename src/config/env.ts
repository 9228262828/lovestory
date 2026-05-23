const normalizeBasePath = (basePath?: string): string => {
  if (!basePath || basePath === '/') {
    return '/'
  }

  return basePath.endsWith('/') ? basePath : `${basePath}/`
}

const requiredEnv = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

export const appConfig = {
  basePath: normalizeBasePath(import.meta.env.VITE_APP_BASE_PATH),
} as const

export const supabaseConfig = {
  url: requiredEnv(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL'),
  anonKey: requiredEnv(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY'),
} as const
