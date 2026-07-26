import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const schema = z.object({
  user_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  occupation_name: z.string().min(1, 'Choose an occupation'),
  institution_name: z.string().optional(),
  phone_number: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const occupations = useQuery({ queryKey: ['occupations'], queryFn: api.listOccupations })

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setError(null)
    try {
      await api.register({
        user_name: values.user_name,
        email: values.email,
        password: values.password,
        occupation_name: values.occupation_name,
        institution_name: values.institution_name || null,
        phone_number: values.phone_number || null,
      })
      await login(values.email, values.password)
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFieldError('email', { message: err.message })
        return
      }
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-plum-600">Register as an author</h1>
        <p className="mt-1 text-sm text-ink-600">Create an account to submit your abstract to SIMIT.</p>
      </div>

      {error && <ErrorState title="Couldn't create your account" message={error} />}

      <Card>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Full name" error={errors.user_name?.message} {...register('user_name')} />
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 6 characters."
            error={errors.password?.message}
            {...register('password')}
          />
          {occupations.isLoading ? (
            <div className="text-sm text-ink-600">Loading occupations…</div>
          ) : occupations.isError ? (
            <ErrorState message="Couldn't load occupations. Refresh and try again." />
          ) : (
            <Select
              label="Occupation"
              placeholder="Select your occupation"
              options={(occupations.data ?? []).map((o) => ({ value: o.occupation_name, label: o.occupation_name }))}
              error={errors.occupation_name?.message}
              defaultValue=""
              {...register('occupation_name')}
            />
          )}
          <Input
            label="Institution"
            hint="Optional"
            error={errors.institution_name?.message}
            {...register('institution_name')}
          />
          <Input
            label="Phone number"
            hint="Optional"
            error={errors.phone_number?.message}
            {...register('phone_number')}
          />
          <Button type="submit" loading={isSubmitting} className="mt-2">
            Create account
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-ink-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}
