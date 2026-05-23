import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/supabase/auth.service'
import { ROUTES } from '@/shared/constants/routes'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatusMessage(null)
    setIsSubmitting(true)

    try {
      const { error } = await authService.signInWithOtp(email)

      if (error) {
        throw error
      }

      setStatusMessage('Magic link sent. Check your email to continue.')
      setEmail('')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-rose-100 bg-white/90 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900">Admin Login</h1>
      <p className="mt-2 text-sm text-zinc-600">Hidden dashboard access using Supabase magic link authentication.</p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
            }}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            placeholder="admin@example.com"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Sending link...' : 'Send magic link'}
        </button>
      </form>

      {statusMessage ? <p className="mt-4 text-sm text-zinc-600">{statusMessage}</p> : null}

      <button
        type="button"
        className="mt-4 text-xs font-medium text-zinc-500 underline-offset-4 hover:underline"
        onClick={() => {
          navigate(ROUTES.home)
        }}
      >
        Back to home
      </button>
    </div>
  )
}
