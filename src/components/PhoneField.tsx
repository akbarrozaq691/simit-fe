import { useMemo, useState } from 'react'
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js'

/** Countries an Indonesian-student symposium in Türkiye will actually see
 *  first. The full list still follows, so nobody is excluded. */
const PRIORITY: CountryCode[] = ['TR', 'ID']

interface Props {
  /** E.164 value, e.g. "+905551234567", or '' when empty. */
  value: string
  onChange: (e164: string) => void
  error?: string
  label?: string
}

/**
 * Country selector plus national number, producing an E.164 string.
 *
 * The backend requires a country code (it rejects bare local numbers), so
 * asking for the country explicitly is clearer than expecting a participant to
 * remember to type "+90". libphonenumber-js supplies the dial codes and the
 * per-country validity rules, so "+90 555 123 45" is caught here rather than
 * by a 422 after submitting.
 */
export function PhoneField({ value, onChange, error, label = 'Phone number' }: Props) {
  const parsed = value ? parsePhoneNumberFromString(value) : undefined
  const [country, setCountry] = useState<CountryCode>(parsed?.country ?? 'TR')
  const [national, setNational] = useState(parsed?.nationalNumber ?? '')

  const countries = useMemo(() => {
    const all = getCountries()
    const rest = all.filter((c) => !PRIORITY.includes(c)).sort()
    return [...PRIORITY, ...rest]
  }, [])

  function emit(nextCountry: CountryCode, nextNational: string) {
    const digits = nextNational.replace(/\D/g, '')
    onChange(digits ? `+${getCountryCallingCode(nextCountry)}${digits}` : '')
  }

  const localFormat = new AsYouType(country).input(national)
  // Only complain once there's enough typed to judge; an empty field is fine
  // because the number is optional.
  const invalid = value !== '' && !isValidPhoneNumber(value)

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-ink-800">{label}</span>
      <div className="flex gap-2">
        <select
          aria-label="Country calling code"
          value={country}
          onChange={(e) => {
            const next = e.target.value as CountryCode
            setCountry(next)
            emit(next, national)
          }}
          className="w-32 shrink-0 rounded-lg border border-ink-200 bg-white px-2 py-2 text-sm"
        >
          {countries.map((c) => (
            <option key={c} value={c}>
              {c} +{getCountryCallingCode(c)}
            </option>
          ))}
        </select>
        <input
          inputMode="tel"
          autoComplete="tel-national"
          value={localFormat}
          onChange={(e) => {
            setNational(e.target.value)
            emit(country, e.target.value)
          }}
          placeholder="555 123 4567"
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 ${
            error || invalid ? 'border-rose-400' : 'border-ink-200'
          }`}
        />
      </div>
      {error ? (
        <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>
      ) : invalid ? (
        <span className="mt-1 block text-xs font-medium text-rose-600">
          That doesn’t look like a valid {country} number.
        </span>
      ) : (
        <span className="mt-1 block text-xs text-ink-600">
          Optional. Stored as {value || `+${getCountryCallingCode(country)}…`}
        </span>
      )}
    </div>
  )
}
