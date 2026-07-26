import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { useAuth, homeFor } from '@/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const expired = params.get('expired') === '1'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setError(null)
    try {
      const auth = await login(values.email, values.password)
      navigate(homeFor(auth.role))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-plum-600">Sign in</h1>
        <p className="mt-1 text-sm text-ink-600">Welcome back to SIMIT.</p>
      </div>

      {expired && !error && (
        <div className="rounded-lg bg-plum-50 px-4 py-3 text-sm text-plum-700 ring-1 ring-plum-100">
          Your session ended. Please sign in again.
        </div>
      )}

      {error && <ErrorState title="Couldn't sign you in" message={error} />}

      <Card>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" loading={isSubmitting} className="mt-2">
            Sign in
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-ink-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Register
        </Link>
      </p>
    </div>
  )
}
