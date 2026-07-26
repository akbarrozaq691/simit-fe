import { TONE_CLASS, type Tone } from '@/lib/status'

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  )
}
