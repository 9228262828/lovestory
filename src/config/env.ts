const normalizeBasePath = (basePath?: string): string => {
  if (!basePath || basePath === '/') {
    return '/'
  }

  return basePath.endsWith('/') ? basePath : `${basePath}/`
}

const normalizeEnvValue = (value?: string): string => value?.trim() ?? ''

const supabaseUrl = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY)

const missingSupabaseEnvKeys = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
].filter((key): key is string => Boolean(key))

const isSupabaseConfigured = missingSupabaseEnvKeys.length === 0

if (!isSupabaseConfigured) {
  console.error(
    `[env] Missing Supabase environment variables: ${missingSupabaseEnvKeys.join(', ')}. The app will render a configuration error screen instead of crashing.`,
  )
}

export const appConfig = {
  basePath: normalizeBasePath(import.meta.env.VITE_APP_BASE_PATH),
} as const

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  missingKeys: missingSupabaseEnvKeys,
  isConfigured: isSupabaseConfigured,
} as const
