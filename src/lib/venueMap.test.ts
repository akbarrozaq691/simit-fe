import { describe, expect, it } from 'vitest'
import { mapEmbedUrl, parseCoordinates } from './venueMap'

describe('parseCoordinates', () => {
  it('reads a plain pair', () => {
    expect(parseCoordinates('39.9334,32.8597')).toEqual({ lat: 39.9334, lng: 32.8597 })
  })

  it('tolerates the space people type after the comma', () => {
    expect(parseCoordinates('39.9334, 32.8597')).toEqual({ lat: 39.9334, lng: 32.8597 })
  })

  it('reads negative values', () => {
    expect(parseCoordinates('-6.2088, 106.8456')).toEqual({ lat: -6.2088, lng: 106.8456 })
  })

  it('reads whole numbers', () => {
    expect(parseCoordinates('40, 33')).toEqual({ lat: 40, lng: 33 })
  })

  it('reads the centre out of a pasted Google Maps URL', () => {
    const url = 'https://www.google.com/maps/place/Ankara/@39.9208,32.8541,13z/data=!3m1'
    expect(parseCoordinates(url)).toEqual({ lat: 39.9208, lng: 32.8541 })
  })

  it('rejects an out-of-range latitude', () => {
    expect(parseCoordinates('91, 32')).toBeNull()
  })

  it('rejects an out-of-range longitude', () => {
    expect(parseCoordinates('39, 181')).toBeNull()
  })

  it('rejects a place name', () => {
    expect(parseCoordinates('Ankara, Türkiye')).toBeNull()
  })

  it('rejects an empty value', () => {
    expect(parseCoordinates('   ')).toBeNull()
  })
})

describe('mapEmbedUrl', () => {
  it('returns null when nothing is set, so the section hides the map', () => {
    expect(mapEmbedUrl('')).toBeNull()
    expect(mapEmbedUrl('   ')).toBeNull()
  })

  it('embeds coordinates', () => {
    expect(mapEmbedUrl('39.9334, 32.8597')).toBe(
      'https://www.google.com/maps?q=39.9334%2C32.8597&z=16&output=embed',
    )
  })

  it('normalises a pasted URL down to its coordinates', () => {
    expect(mapEmbedUrl('https://maps.google.com/maps/@39.9208,32.8541,13z')).toBe(
      'https://www.google.com/maps?q=39.9208%2C32.8541&z=16&output=embed',
    )
  })

  it('falls back to searching for a place name', () => {
    expect(mapEmbedUrl('Hacettepe University')).toBe(
      'https://www.google.com/maps?q=Hacettepe%20University&z=16&output=embed',
    )
  })

  it('escapes a place name that would otherwise break the query', () => {
    expect(mapEmbedUrl('Ankara & Bilkent')).toContain('Ankara%20%26%20Bilkent')
  })

  it('needs no API key, so the map works without a billing account', () => {
    expect(mapEmbedUrl('39.9,32.8')).toContain('output=embed')
    expect(mapEmbedUrl('39.9,32.8')).not.toContain('key=')
  })
})
