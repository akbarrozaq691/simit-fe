import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { api } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { FileInput } from '@/components/ui/FileInput'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  authors: z.string().min(1, 'Authors are required'),
  abstract: z.string().min(1, 'Abstract is required'),
  keywords: z.string().optional(),
  id_topic: z.string().optional(),
  sub_topic: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function SubmitAbstract() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const topics = useQuery({ queryKey: ['topics'], queryFn: api.listTopics })

  const {
    register,
    handleSubmit,
    control,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  // The sub-theme list depends on the chosen topic, so the form has to watch it.
  const chosenTopicId = useWatch({ control, name: 'id_topic' })
  const chosenTopic = (topics.data ?? []).find((tp) => tp.id_topic === chosenTopicId)
  // Sub-themes are stored in three tables by track; an author just picks from
  // whichever ones belong to their topic.
  const subThemes = chosenTopic
    ? [...chosenTopic.stem, ...chosenTopic.humanity, ...chosenTopic.interdisciplinary].map(
        (s) => s.name,
      )
    : []

  const mutation = useMutation({
    // Upload before create, deliberately: only a successful upload earns an
    // article record. If the upload fails (e.g. storage isn't configured),
    // nothing is created and the caller sees the real error.
    mutationFn: async (values: FormValues) => {
      if (!file) throw new Error('missing-file')
      const { file_path } = await api.uploadPdf(file)
      return api.createArticle({
        title: values.title,
        authors: values.authors,
        abstract: values.abstract,
        keywords: values.keywords || null,
        abstract_file_path: file_path,
        id_topic: values.id_topic || null,
        sub_topic: values.sub_topic || null,
      })
    },
    onSuccess: async (article) => {
      await queryClient.invalidateQueries({ queryKey: ['articles'] })
      navigate(`/articles/${article.id_article}`)
    },
  })

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    if (!file) {
      setFileError('A PDF file is required')
      return
    }
    setFileError(null)
    try {
      await mutation.mutateAsync(values)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <PageHeader
        title="Submit abstract"
        description="Your PDF is uploaded first — the submission is only created once the upload succeeds."
      />

      {submitError && <ErrorState title="Couldn't submit your abstract" message={submitError} />}

      <Card>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Input
            label="Authors"
            hint="Full names, separated by commas"
            error={errors.authors?.message}
            {...register('authors')}
          />
          <Textarea
            label="Abstract"
            rows={6}
            error={errors.abstract?.message}
            {...register('abstract')}
          />
          <Input
            label="Keywords"
            hint="Optional, comma-separated"
            error={errors.keywords?.message}
            {...register('keywords')}
          />
          {topics.isLoading ? (
            <div className="text-sm text-ink-600">Loading topics…</div>
          ) : topics.isError ? (
            <ErrorState message="Couldn't load topics. You can still submit without one." />
          ) : (
            <Select
              label="Topic"
              hint="Optional"
              placeholder="Select a topic"
              options={(topics.data ?? []).map((t) => ({ value: t.id_topic, label: t.topic_name }))}
              defaultValue=""
              error={errors.id_topic?.message}
              {...register('id_topic', {
                // A sub-theme belongs to one topic, so a stale selection would
                // be rejected by the server on submit.
                onChange: () => resetField('sub_topic', { defaultValue: '' }),
              })}
            />
          )}

          {subThemes.length > 0 && (
            <Select
              label="Sub theme"
              hint="Which sub-theme of that topic the paper addresses"
              placeholder="Select a sub theme"
              options={subThemes.map((name) => ({ value: name, label: name }))}
              defaultValue=""
              error={errors.sub_topic?.message}
              {...register('sub_topic')}
            />
          )}
          <FileInput
            label="Abstract PDF"
            error={fileError ?? undefined}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setFileError(null)
            }}
          />
          <Button type="submit" loading={isSubmitting || mutation.isPending} className="mt-2">
            Submit abstract
          </Button>
        </form>
      </Card>
    </div>
  )
}
