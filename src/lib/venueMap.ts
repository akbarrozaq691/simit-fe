/** Turning what an organiser pastes into an embeddable Google Maps URL. */

export interface Coordinates {
  lat: number
  lng: number
}

const PAIR = /^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/
/** Google Maps puts the map centre after an @ in its own URLs. */
const IN_URL = /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/

function inRange(lat: number, lng: number): boolean {
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

/**
 * Reads coordinates out of a plain pair or a pasted Google Maps link.
 *
 * Both are accepted because both are what people actually have to hand: the
 * numbers from the "copy coordinates" menu item, or the URL from the address
 * bar. Returns null for anything else, which the caller treats as a place name.
 */
export function parseCoordinates(value: string): Coordinates | null {
  const trimmed = value.trim()
  const match = PAIR.exec(trimmed) ?? IN_URL.exec(trimmed)
  if (!match) return null
  const lat = Number(match[1])
  const lng = Number(match[2])
  return inRange(lat, lng) ? { lat, lng } : null
}

/**
 * The `src` for the venue map, or null when there is nothing to show.
 *
 * `output=embed` needs no API key, which keeps the venue map working without a
 * billing account behind it. Anything that is not coordinates is passed through
 * as a search term, so a venue name resolves too.
 */
export function mapEmbedUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const coords = parseCoordinates(trimmed)
  const query = coords ? `${coords.lat},${coords.lng}` : trimmed
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`
}
