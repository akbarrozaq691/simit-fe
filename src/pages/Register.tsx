import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { STUDENT_LEVELS } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PhoneField } from '@/components/PhoneField'

const common = {
  user_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  institution_name: z.string().optional(),
}

/** The two branches differ in how occupation is supplied, so this is a
 *  discriminated union rather than a pile of optional fields — an invalid
 *  combination then cannot pass validation at all, matching the backend, which
 *  rejects a student sending free text and a presenter sending an id. */
const schema = z.discriminatedUnion('register_as', [
  z.object({
    ...common,
    register_as: z.literal('student'),
    id_occupation: z.string().min(1, 'Choose your study level'),
  }),
  z.object({
    ...common,
    register_as: z.literal('general_presenter'),
    occupation_name: z.string().min(1, 'Tell us your occupation'),
  }),
])

type FormValues = z.infer<typeof schema>

const OPTIONS = [
  { value: 'student', label: 'Student', hint: 'Pick your study level' },
  { value: 'general_presenter', label: 'General presenter', hint: 'Type your own occupation' },
] as const

export function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  // Kept outside react-hook-form: PhoneField owns the country/national split
  // and emits a single E.164 string.
  const [phone, setPhone] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    resetField,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { register_as: 'student' } as FormValues,
  })

  const registerAs = watch('register_as')
  const isStudent = registerAs === 'student'
  // The union means only one branch's keys exist at a time; this keeps the JSX
  // readable without casting at every call site.
  const fieldErrors = errors as Record<string, { message?: string } | undefined>

  async function onSubmit(values: FormValues) {
    setError(null)
    try {
      await api.register({
        user_name: values.user_name,
        email: values.email,
        password: values.password,
        register_as: values.register_as,
        id_occupation: values.register_as === 'student' ? values.id_occupation : null,
        occupation_name:
          values.register_as === 'general_presenter' ? values.occupation_name : null,
        institution_name: values.institution_name || null,
        phone_number: phone || null,
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

  function chooseKind(kind: FormValues['register_as']) {
    setValue('register_as', kind, { shouldValidate: false })
    // Clear the other branch's field so a value typed before switching can
    // never be submitted against the wrong branch.
    resetField(kind === 'student' ? ('occupation_name' as never) : ('id_occupation' as never))
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
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-ink-800">Registering as</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {OPTIONS.map((option) => {
                const active = registerAs === option.value
                return (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-lg border p-3 transition ${
                      active
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-100'
                        : 'border-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="register_as"
                        value={option.value}
                        checked={active}
                        onChange={() => chooseKind(option.value)}
                      />
                      <span className="text-sm font-semibold text-ink-900">{option.label}</span>
                    </span>
                    <span className="mt-0.5 block pl-6 text-xs text-ink-600">{option.hint}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <Input
            label="Full name"
            hint="Capitalisation is tidied up automatically."
            error={fieldErrors.user_name?.message}
            {...register('user_name')}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={fieldErrors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 6 characters."
            error={fieldErrors.password?.message}
            {...register('password')}
          />

          {isStudent ? (
            <Select
              label="Study level"
              placeholder="Select your study level"
              options={STUDENT_LEVELS.map((level) => ({ value: level.id, label: level.label }))}
              error={fieldErrors.id_occupation?.message}
              defaultValue=""
              {...register('id_occupation' as never)}
            />
          ) : (
            <Input
              label="Occupation"
              placeholder="e.g. Lecturer, Researcher, Engineer"
              hint="Type your own — this one isn't a fixed list."
              error={fieldErrors.occupation_name?.message}
              {...register('occupation_name' as never)}
            />
          )}

          <Input
            label="Institution"
            hint="Optional"
            error={fieldErrors.institution_name?.message}
            {...register('institution_name')}
          />

          <PhoneField value={phone} onChange={setPhone} />

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
