import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/supabase/auth.service'
import { ROUTES } from '@/shared/constants/routes'

const getFriendlyAuthErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'We could not sign you in. Please check your details and try again.'
  }

  const message = error.message.toLowerCase()

  if (message.includes('invalid login credentials')) {
    return 'The email or password is incorrect. Please check both and try again.'
  }

  if (message.includes('email not confirmed')) {
    return 'Please confirm this admin email before signing in.'
  }

  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many sign-in attempts. Please wait a moment, then try again.'
  }

  return 'We could not sign you in. Please check your details and try again.'
}

export const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const { error } = await authService.signInWithPassword(email.trim(), password)

      if (error) {
        throw error
      }

      setEmail('')
      setPassword('')
      navigate(ROUTES.admin, { replace: true })
    } catch (error) {
      setErrorMessage(getFriendlyAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-rose-100 bg-white/95 p-5 shadow-xl shadow-rose-100/60 sm:p-7">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">Admin access</p>
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">Sign in to the dashboard</h1>
        <p className="text-sm leading-6 text-zinc-600">
          Use your admin email and password to manage the private dashboard.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            autoComplete="email"
            required
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
            }}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            placeholder="admin@example.com"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-700">Password</span>
          <input
            autoComplete="current-password"
            required
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
            }}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            placeholder="Enter your password"
          />
        </label>

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-rose-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <button
        type="button"
        className="mt-5 w-full text-center text-xs font-medium text-zinc-500 underline-offset-4 hover:underline sm:w-auto"
        onClick={() => {
          navigate(ROUTES.home)
        }}
      >
        Back to home
      </button>
    </div>
  )
}
